# Copyright (c) 2025, craft and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ReceivedBundle(Document):
    pass


def create_stock_entry_on_submit(doc, method):
    """
    Automatically create a Material Transfer Stock Entry
    when Received Bundle is submitted.
    """

    # Validation
    if not doc.from_warehouse or not doc.to_warehouse:
        frappe.throw("From Warehouse and To Warehouse are required to create Stock Entry.")

    # Prevent duplicate Stock Entry
    existing = frappe.db.exists("Stock Entry", {"received_bundle": doc.name})
    if existing:
        frappe.msgprint(f"Stock Entry {existing} already exists for this Received Bundle.")
        return

    # --------------------------
    # Create Stock Entry
    # --------------------------
    branch = None
    if doc.from_warehouse:
        branch = frappe.db.get_value("Warehouse", doc.to_warehouse, "custom_branch")
    stock_entry = frappe.new_doc("Stock Entry")
    stock_entry.stock_entry_type = "Material Transfer"
    stock_entry.from_warehouse = doc.from_warehouse
    stock_entry.to_warehouse = doc.to_warehouse
    # stock_entry.branch = branch

    # Optional link back
    if frappe.get_meta("Stock Entry").has_field("received_bundle"):
        stock_entry.received_bundle = doc.name

    items = []

    # Loop through bundles in Received Bundle
    for row in doc.bundles:
        if not row.bundle:
            continue

        # Get linked Bundle Creator document
        bundle_creator = frappe.get_doc("Bundle Creator", row.bundle)

        # Loop through packet items in Bundle Creator
        for packet_row in bundle_creator.packet_items:
            if not packet_row.packet_id:
                continue

            # Get Packet Generator document
            packet_doc = frappe.get_doc("Packet Generator", packet_row.packet_id)

            # Collect items from Packet Generator → items table
            for item_row in packet_doc.items:
                if item_row.item_code:
                    items.append({
                        "item_code": item_row.item_code,
                        "s_warehouse": doc.from_warehouse,
                        "t_warehouse": doc.to_warehouse,
                        "qty": item_row.qty or 1,
                        "uom": item_row.uom or "",
                        "branch":branch
                    })

    if not items:
        frappe.throw("No items found in linked Bundles (via Packets) to create Stock Entry.")

    # Add items to Stock Entry
    for item in items:
        stock_entry.append("items", item)

    # Save and submit Stock Entry
    stock_entry.insert(ignore_permissions=True)
    stock_entry.submit()

    frappe.msgprint(f"Stock Entry <b>{stock_entry.name}</b> created successfully for Received Bundle <b>{doc.name}</b>.")
