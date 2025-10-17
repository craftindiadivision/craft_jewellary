











    // custom_locker_select(frm) {
    //     if (frm.doc.docstatus === 1) {
    //         frappe.msgprint("You cannot transfer after submitting the Unbundling document.");
    //         return;
    //     }

    //     frm.set_value("custom_custom_items_visible", 1);

    //     // Track number of transfers
    //     frm._transfer_count = frm._transfer_count || 0;
    //     frm._transfer_count += 1;

    //     // Save previous selection as read-only if exists
    //     if (frm.doc.custom_selected_items && frm.doc.custom_selected_items.length) {
    //         frm.set_df_property("custom_selected_items", "read_only", 1);
    //     }

    //     // Create a fresh selection table for this transfer
    //     frm.clear_table("custom_selected_items");

    //     // Exclude already transferred items
    //     const alreadyTransferred = (frm.doc.custom_transferred_items || []).map(d => d.item_code);

    //     (frm.doc.packing_items || []).forEach(item => {
    //         if (!alreadyTransferred.includes(item.item_code)) {
    //             let row = frm.add_child("custom_selected_items");
    //             row.item_code = item.item_code;
    //             row.item_name = item.item_name;
    //             row.qty = item.qty;
    //             row.uom = item.uom;
    //             row.serial_no = item.serial_no;
    //         }
    //     });

    //     frm.refresh_field("custom_selected_items");






// frappe.ui.form.on("Unbundling", {
//     bundle(frm) {
//         if (frm.doc.bundle) {
//             frappe.call({
//                 method: "kalyan.kalyan.doctype.unbundling.unbundling.get_bundle_details",
//                 args: { bundle: frm.doc.bundle },
//                 callback(r) {
//                     if (r.message) {
//                         frm.clear_table("packing_items");
//                         (r.message.items || []).forEach(item => {
//                             let row = frm.add_child("packing_items");
//                             row.item_code = item.item_code;
//                             row.item_name = item.item_name;
//                             row.qty = item.qty;
//                             row.uom = item.uom;
//                             row.serial_no = item.serial_no || "";
//                         });
//                         frm.refresh_field("packing_items");
//                     }
//                 }
//             });
//         }
//     },




// custom_locker_select(frm) {
//     if (frm.doc.docstatus === 1) {
//         frappe.msgprint("You cannot transfer after submitting the Unbundling document.");
//         return;
//     }

//     frm.set_value("custom_custom_items_visible", 1);

//     frm._transfer_count = frm._transfer_count || 0;
//     frm._transfer_count += 1;

//     if (frm.doc.custom_selected_items && frm.doc.custom_selected_items.length) {
//         frm.set_df_property("custom_selected_items", "read_only", 1);
//     }

//     frm.clear_table("custom_selected_items");

//     const alreadyTransferred = (frm.doc.custom_transferred_items || []).map(d => d.item_code);

//     let newItemsAdded = false;
//     (frm.doc.packing_items || []).forEach(item => {
//         if (!alreadyTransferred.includes(item.item_code)) {
//             let row = frm.add_child("custom_selected_items");
//             row.item_code = item.item_code;
//             row.item_name = item.item_name;
//             row.qty = item.qty;
//             row.uom = item.uom;
//             row.serial_no = item.serial_no;
//             newItemsAdded = true;
//         }
//     });

//     frm.refresh_field("custom_selected_items");

//     if (!newItemsAdded) {
//         frappe.msgprint("All items have already been transferred.");
//         frm.set_df_property("custom_selected_items", "hidden", 1);
//         return;
//     } else {
//         frm.set_df_property("custom_selected_items", "hidden", 0);
//     }

    




//     frm.add_custom_button("Transfer", () => {
//             if (frm.doc.docstatus === 1) {
//                 frappe.msgprint("You cannot transfer after submitting the Unbundling document.");
//                 return;
//             }

//             if (frm.is_dirty()) {
//                 frm.save().then(() => create_stock_transfer(frm));
//             } else {
//                 create_stock_transfer(frm);
//             }
//         });

//     },

//     refresh(frm) {
//         frm.set_df_property("custom_selected_items", "hidden", !frm.doc.custom_custom_items_visible);

//         if (frm.doc.docstatus === 1) {
//             frm.set_df_property("custom_locker_select", "read_only", 1);
//             frm.set_df_property("custom_selected_items", "read_only", 1);
//         }
//     }
// });



// function create_stock_transfer(frm) {
//     frappe.confirm(
//         "Are you sure you want to create a Stock Entry for the selected items?",
//         () => {
//             frappe.call({
//                 method: "kalyan.kalyan.doctype.unbundling.unbundling.create_stock_entry_from_unbundling",
//                 args: { docname: frm.doc.name },
//                 freeze: true,
//                 freeze_message: "Creating Stock Entry...",
//                 callback(r) {
//                     if (!r.exc) {
//                         frappe.msgprint({
//                             title: "Success",
//                             message: " Stock Entry created successfully.",
//                             indicator: "green"
//                         });

                    
//                         if (!frm.doc.custom_transferred_items) {
//                             frm.set_value("custom_transferred_items", []);
//                         }
//                         const transferred = frm.doc.custom_selected_items.map(d => ({
//                             item_code: d.item_code
//                         }));
//                         frm.doc.custom_transferred_items.push(...transferred);
//                         frm.refresh_field("custom_transferred_items");

                    
//                         frm.clear_table("custom_selected_items");
//                         frm.refresh_field("custom_selected_items");
//                     }
//                 }
//             });
//         }
//     );
// }


frappe.ui.form.on("Unbundling", {
    bundle(frm) {
        if (frm.doc.bundle) {
            frappe.call({
                method: "kalyan.kalyan.doctype.unbundling.unbundling.get_bundle_details",
                args: { bundle_creator_name: frm.doc.bundle },
                callback(r) {
                    if (r.message) {
                        frm.clear_table("packing_items");
                        (r.message.items || []).forEach(item => {
                            let row = frm.add_child("packing_items");
                            row.item_code = item.item_code;
                            row.item_name = item.item_name;
                            row.qty = item.qty;
                            row.uom = item.uom;
                             row.serial_no = item.serial_no;
                        });
                        frm.refresh_field("packing_items");
                    }
                }
            });
        }
    },

    custom_locker_select(frm) {
        if (frm.doc.docstatus === 1) {
            frappe.msgprint("You cannot transfer after submitting the Unbundling document.");
            return;
        }

        frm.set_value("custom_custom_items_visible", 1);
        frm._transfer_count = frm._transfer_count || 0;
        frm._transfer_count += 1;

        if (frm.doc.custom_selected_items && frm.doc.custom_selected_items.length) {
            frm.set_df_property("custom_selected_items", "read_only", 1);
        }

        frm.clear_table("custom_selected_items");

        const alreadyTransferred = (frm.doc.custom_transferred_items || []).map(d => d.item_code);

        let newItemsAdded = false;
        (frm.doc.packing_items || []).forEach(item => {
            if (!alreadyTransferred.includes(item.item_code)) {
                let row = frm.add_child("custom_selected_items");
                row.item_code = item.item_code;
                row.item_name = item.item_name;
                row.qty = item.qty;
                row.uom = item.uom;
                row.serial_no = item.serial_no;
                newItemsAdded = true;
            }
        });

        frm.refresh_field("custom_selected_items");

        if (!newItemsAdded) {
            frappe.msgprint("All items have already been transferred.");
            frm.set_df_property("custom_selected_items", "hidden", 1);
            return;
        } else {
            frm.set_df_property("custom_selected_items", "hidden", 0);
        }

        frm.add_custom_button("Transfer", () => {
            if (frm.doc.docstatus === 1) {
                frappe.msgprint("You cannot transfer after submitting the Unbundling document.");
                return;
            }

            if (frm.is_dirty()) {
                frm.save().then(() => create_stock_transfer(frm));
            } else {
                create_stock_transfer(frm);
            }
        });
    },

    refresh(frm) {
        frm.set_df_property("custom_selected_items", "hidden", !frm.doc.custom_custom_items_visible);

        if (frm.doc.docstatus === 1) {
            frm.set_df_property("custom_locker_select", "read_only", 1);
            frm.set_df_property("custom_selected_items", "read_only", 1);
        }
    }
});

function create_stock_transfer(frm) {
    frappe.confirm(
        "Are you sure you want to create a Stock Entry for the selected items?",
        () => {
            frappe.call({
                method: "kalyan.kalyan.doctype.unbundling.unbundling.create_stock_entry_from_unbundling",
                args: { docname: frm.doc.name },
                freeze: true,
                freeze_message: "Creating Stock Entry...",
                callback(r) {
                    if (!r.exc) {
                        frappe.msgprint({
                            title: "Success",
                            message: "Materials Transferred to Locker.",
                            indicator: "green"
                        });
                        

                        if (!frm.doc.custom_transferred_items) {
                            frm.set_value("custom_transferred_items", []);
                        }

                        const transferred = frm.doc.custom_selected_items.map(d => ({
                            item_code: d.item_code
                        }));
                        frm.doc.custom_transferred_items.push(...transferred);
                        frm.refresh_field("custom_transferred_items");

                        frm.clear_table("custom_selected_items");
                        frm.refresh_field("custom_selected_items");
                    }
                }
            });
        }
    );
}
