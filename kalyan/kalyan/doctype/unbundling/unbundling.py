










# import frappe
# from frappe.model.document import Document

# class Unbundling(Document):
#     pass


# @frappe.whitelist()
# def get_bundle_details(bundle):
#     """Fetch bundle items for Unbundling."""
#     bundle_doc = frappe.get_doc("Bundle", bundle)
#     return {
#         "items": [
#             {
#                 "item_code": d.item or d.item_code,
#                 "item_name": d.item_name,
#                 "qty": d.qty,
#                 "uom": d.uom,
#                 "serial_no": getattr(d, "serial_no", "")
#             }
#             for d in bundle_doc.bundle_items
#         ]
#     }


# @frappe.whitelist()
# def create_stock_entry_from_unbundling(docname):
#     doc = frappe.get_doc("Unbundling", docname)

#     if doc.docstatus == 1:
#         frappe.throw("Cannot create Stock Entry after Unbundling is submitted.")

#     create_stock_entry_from_unbundling_internal(doc)
#     frappe.db.commit()
#     return "Stock Entry Created"





# def create_stock_entry_from_unbundling_internal(doc):
#     """Create Material Transfer Stock Entry from selected items."""
#     if not doc.custom_selected_items:
#         frappe.throw("No items selected for transfer.")

#     se = frappe.new_doc("Stock Entry")
#     se.stock_entry_type = "Material Transfer"
#     se.from_warehouse = doc.source_warehouse
#     se.to_warehouse = doc.locker

#     for d in doc.custom_selected_items:
#         item_doc = frappe.get_doc("Item", d.item_code)

#         if item_doc.has_serial_no:
#             if not d.serial_no:
#                 frappe.throw(f"Serial No required for serialized item {d.item_code}")

#             serials = [s.strip() for s in d.serial_no.split(",")]
#             for sn in serials:
#                 se.append("items", {
#                     "item_code": d.item_code,
#                     "item_name": d.item_name,
#                     "qty": 1,
#                     "uom": d.uom,
#                     "s_warehouse": doc.source_warehouse,
#                     "t_warehouse": doc.locker,
#                     "serial_no": sn
#                 })

#         elif item_doc.has_batch_no:
#             if not d.serial_no:
#                 frappe.throw(f"Batch No required for batch-tracked item {d.item_code}")

#             se.append("items", {
#                 "item_code": d.item_code,
#                 "item_name": d.item_name,
#                 "qty": d.qty,
#                 "uom": d.uom,
#                 "s_warehouse": doc.source_warehouse,
#                 "t_warehouse": doc.locker,
#                 "batch_no": d.serial_no
#             })

#         else:
#             se.append("items", {
#                 "item_code": d.item_code,
#                 "item_name": d.item_name,
#                 "qty": d.qty,
#                 "uom": d.uom,
#                 "s_warehouse": doc.source_warehouse,
#                 "t_warehouse": doc.locker
#             })
 
#     se.insert()
#     se.submit()
















import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.model.document import Document

class Unbundling(Document):
    pass


# @frappe.whitelist()
# # def make_unbundling_from_received_bundle(source_name, target_doc=None):
# #     print(88888888888888888888)
# #     """
# #     Maps a Received Bundle to a new Unbundling document,
# #     including bundles -> packing_items
# #     """

# def make_unbundling_from_received_bundle(source_name, target_doc=None):

#   doc = get_mapped_doc(
#     "Received Bundle",
#     source_name,
#         {
#             "Received Bundle": {
#                 "doctype": "Unbundling"
#             },
#         },
#         target_doc
#     )
#   return doc

    # # return get_mapped_doc(
    # #     "Received Bundle",
    # #     source_name,
    # #     {
    # #         "Received Bundle": {
    # #             "doctype": "Unbundling",
    # #             "field_map": {
    # #                 "name": "received_bundle",
    # #                 "from_warehouse": "source_warehouse",
    # #                 "to_warehouse": "locker"  # rename target warehouse field
    # #             }
    # #         },
    # #         "Bundles": {  # child table mapping
    # #             "doctype": "Packing Items",
    # #             "field_map": {
    # #                 "bundle": "bundle"
    # #             }
    # #         }
    #     },
    #     target_doc
    # )

@frappe.whitelist()
def get_bundle_details(bundle_creator_name):
    """Fetch all items from Packet Generator inside the selected Bundle Creator."""
    bundle_creator = frappe.get_doc("Bundle Creator", bundle_creator_name)
    
    all_items = []
    for packet in bundle_creator.packet_items:
        packet_doc = frappe.get_doc("Packet Generator", packet.packet_id)
        for item in packet_doc.items:
            all_items.append({
                "item_code": item.item_code,      
                "item_name": item.item_name,
                "qty": item.qty,
                "uom": item.uom,
               "serial_no": item.serial_nos 
            })
    
    return {"items": all_items}

@frappe.whitelist()
def create_stock_entry_from_unbundling(docname):
    doc = frappe.get_doc("Unbundling", docname)

    if doc.docstatus == 1:
        frappe.throw("Cannot create Stock Entry after Unbundling is submitted.")

    create_stock_entry_from_unbundling_internal(doc)
    frappe.db.commit()
    return "Stock Entry Created"







def create_stock_entry_from_unbundling_internal(doc):
    """Create Material Transfer Stock Entry from custom_selected_items (one serial per item)."""
    
    if not doc.custom_selected_items:
        frappe.throw("No items selected for transfer.")

    se = frappe.new_doc("Stock Entry")
    se.stock_entry_type = "Material Transfer"
    se.from_warehouse = doc.source_warehouse
    se.to_warehouse = doc.locker

    for d in doc.custom_selected_items:
        if not d.serial_no:
            frappe.throw(f"Serial No required for item {d.item_code}")
        
        se.append("items", {
            "item_code": d.item_code,
            "item_name": d.item_name,
            "qty": 1,
            "uom": d.uom,
            "s_warehouse": doc.source_warehouse,
            "t_warehouse": doc.locker,
            "serial_no": d.serial_no,
            "use_serial_batch_fields": 1
        })

    se.insert(ignore_permissions=True)
    se.submit()
    
    return se.name
