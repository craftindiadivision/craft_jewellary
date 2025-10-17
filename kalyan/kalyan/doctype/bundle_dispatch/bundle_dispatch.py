# Copyright (c) 2025, craft and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class BundleDispatch(Document):
    pass


def create_stock_entry_on_submit(doc, method):
    """
    Automatically create a Material Transfer Stock Entry,
    Route Receipts (first), and then a Received Bundle (Draft)
    when Bundle Dispatch is submitted.
    """

    # Validation
    if not doc.from_warehouse or not doc.to_warehouse:
        frappe.throw("Both From Warehouse and To Warehouse are required to create Stock Entry.")

    # Prevent duplicate creation
    existing = frappe.db.exists("Stock Entry", {"bundle_dispatch": doc.name})
    if existing:
        frappe.msgprint(f"Stock Entry {existing} already exists for this Bundle Dispatch.")
        return

    # --------------------------
    # Create Stock Entry
    # --------------------------
    branch = None
    if doc.from_warehouse:
        branch = frappe.db.get_value("Warehouse", doc.from_warehouse, "custom_branch")

    stock_entry = frappe.new_doc("Stock Entry")
    stock_entry.stock_entry_type = "Material Transfer"
    stock_entry.add_to_transit = 1
    stock_entry.from_warehouse = doc.from_warehouse
    stock_entry.to_warehouse = doc.transit_warehouse
    stock_entry.bundle_dispatch = doc.name

    items = []

    # Loop through Bundles in Bundle Dispatch
    for row in doc.bundles:
        if not row.bundle:
            continue

        bundle_creator = frappe.get_doc("Bundle Creator", row.bundle)

        for packet_row in bundle_creator.packet_items:
            if not packet_row.packet_id:
                continue

            packet_doc = frappe.get_doc("Packet Generator", packet_row.packet_id)

            for item_row in packet_doc.items:
                if item_row.item_code:
                    items.append({
                        "item_code": item_row.item_code,
                        "s_warehouse": doc.from_warehouse,
                        "t_warehouse": doc.transit_warehouse,
                        "qty": item_row.qty or 1,
                        "uom": item_row.uom or "",
                        "branch": branch,
                        "use_serial_batch_fields": 1,
                        "serial_no": item_row.serial_nos
                    })

    if not items:
        frappe.throw("No items found in linked Bundles (via Packets) to create Stock Entry.")

    for item in items:
        stock_entry.append("items", item)

    stock_entry.insert(ignore_permissions=True)
    stock_entry.submit()

    frappe.msgprint("Transferred Successfully")

    # --------------------------------------------------
    #  Create Route Receipts (First)
    # --------------------------------------------------
    route_doc = frappe.get_doc("Route", doc.route)
    created_route_receipts = []

    for row in route_doc.branches:
        route_receipt = frappe.new_doc("Route Receipt")
        route_receipt.route = route_doc.name
        route_receipt.branch = row.branch
        route_receipt.from_branch = doc.from_branch
        route_receipt.to_branch = doc.to_branch
        route_receipt.dispatched_on = nowdate()
        route_receipt.bundle_dispatch = doc.name

        for i in doc.bundles:
            if i.bundle:
                route_receipt.append("bundle", {
                    "bundle": i.bundle
                })

        route_receipt.insert(ignore_permissions=True)
        created_route_receipts.append({
            "route_receipt": route_receipt.name,
            "branch": row.branch
        })

    # --------------------------------------------------
    #  Create Received Bundle (After Route Receipts)
    # --------------------------------------------------
    received_bundle = frappe.new_doc("Received Bundle")
    received_bundle.from_warehouse = doc.transit_warehouse
    received_bundle.to_warehouse = doc.to_warehouse
    received_bundle.from_branch = doc.from_branch
    received_bundle.to_branch = doc.to_branch
    received_bundle.route = doc.route
    received_bundle.bundle_dispatch = doc.name
    received_bundle.date = frappe.utils.nowdate()

    # Copy bundles
    for row in doc.bundles:
        if row.bundle:
            received_bundle.append("bundles", {"bundle": row.bundle})

    #  Add created Route Receipts to 'route_receipt_details' child table
    for rr in created_route_receipts:
        received_bundle.append("route_receipt_details", {
            "route": rr["branch"],
            "status": frappe.db.get_value("Route Receipt", rr["route_receipt"], "workflow_state") or "Pending",
            "route_receipt": rr["route_receipt"]
        })

    received_bundle.insert(ignore_permissions=True)



def update_received_bundle_status(doc, method):
    """
    Triggered when Route Receipt is validated.
    Updates the corresponding 'status' field inside the
    Received Bundle's route_receipt_details table.
    """
    if not doc.bundle_dispatch:
        return

    received_bundles = frappe.get_all(
        "Received Bundle",
        filters={"bundle_dispatch": doc.bundle_dispatch},
        fields=["name"]
    )

    for rb in received_bundles:
        rb_doc = frappe.get_doc("Received Bundle", rb.name)
        updated = False

        for row in rb_doc.route_receipt_details:
            if row.route_receipt == doc.name:
                row.status = doc.workflow_state or "Pending"
                updated = True

        if updated:
            rb_doc.save(ignore_permissions=True)



@frappe.whitelist()
def get_matching_bundles(to_be_delivered):
    """Return Bundle Creator documents matching given filters."""
    filters = {
        # "from_warehouse": from_warehouse,
        # "to_warehouse": to_warehouse,
        # "route": route,
        "to_be_delivered": to_be_delivered
    }

    bundles = frappe.get_all("Bundle Creator", filters=filters, fields=["name"])
    
    return bundles or []

@frappe.whitelist()
def get_transporters():
    """
    Fetch all Suppliers where 'Is Transporter' is checked.
    """
    transporters = frappe.get_all(
        "Supplier",
        filters={"is_transporter": 1},
        fields=["name", "supplier_name"]
    )

    return transporters

