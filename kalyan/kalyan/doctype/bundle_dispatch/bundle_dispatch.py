# Copyright (c) 2025, craft and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate
class BundleDispatch(Document):
    pass


def create_stock_entry_on_submit(doc, method):
    """
    Automatically create a Material Transfer Stock Entry
    and a Received Bundle (Draft) when Bundle Dispatch is submitted.
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
    stock_entry.to_warehouse = doc.courier_agent
    stock_entry.bundle_dispatch = doc.name
    # stock_entry.branch = doc.branch
    

    items = []

    # Loop through Bundles in Bundle Dispatch
    for row in doc.bundles:
        if not row.bundle:
            continue

        # Get the linked Bundle Creator document
        bundle_creator = frappe.get_doc("Bundle Creator", row.bundle)

        # Loop through each packet item in Bundle Creator
        for packet_row in bundle_creator.packet_items:
            if not packet_row.packet_id:
                continue

            # Get Packet Generator document
            packet_doc = frappe.get_doc("Packet Generator", packet_row.packet_id)

            # Collect items from Packet Generator
            for item_row in packet_doc.items:
                if item_row.item_code:
                    items.append({
                        "item_code": item_row.item_code,
                        "s_warehouse": doc.from_warehouse,
                        "t_warehouse": doc.courier_agent,
                        "qty": item_row.qty or 1,
                        "uom": item_row.uom or "",
                        "branch":branch,
                        "use_serial_batch_fields":1,
                        "serial_no":item_row.serial_nos
                    })

    if not items:
        frappe.throw("No items found in linked Bundles (via Packets) to create Stock Entry.")

    # Add items to Stock Entry
    for item in items:
        stock_entry.append("items", item)

    # Save and Submit Stock Entry
    stock_entry.insert(ignore_permissions=True)
    stock_entry.submit()

    frappe.msgprint(f"Stock Entry <b>{stock_entry.name}</b> created successfully for Bundle Dispatch <b>{doc.name}</b>.")

    # --------------------------
    # Create Received Bundle (Draft)
    # --------------------------
    received_bundle = frappe.new_doc("Received Bundle")
    received_bundle.from_warehouse = doc.courier_agent  # courier agent acts as source
    received_bundle.to_warehouse = doc.to_warehouse
    received_bundle.route = doc.route
    received_bundle.bundle_dispatch = doc.name
    received_bundle.date = frappe.utils.nowdate()
    # received_bundle.workflow_state = "Pending"
    # received_bundle.bundle_dispatch = doc.name  # optional link

    # Copy bundles from Bundle Dispatch
    for row in doc.bundles:
        if row.bundle:
            received_bundle.append("bundles", {
                "bundle": row.bundle
            })

    # Save Draft Received Bundle
    received_bundle.insert(ignore_permissions=True)

# --------------------------------------------------
#  create route receipt
# ----------------------------------
    route_doc = frappe.get_doc("Route", doc.route)

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


    frappe.msgprint(f"Received Bundle <b>{received_bundle.name}</b> created for Bundle Dispatch <b>{doc.name}</b>.")
  


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

