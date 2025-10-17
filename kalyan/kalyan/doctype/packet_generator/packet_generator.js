frappe.ui.form.on("Packet Generator", {
    refresh: function(frm) {
        // Filter source_warehouse based on from_branch
        frm.set_query("source_warehouse", function() {
            if (frm.doc.from_branch) {
                return {
                    filters: {
                        custom_branch: frm.doc.from_branch
                    }
                };
            }
        });
        frm.set_query("target_warehouse", function() {
            if (frm.doc.to_branch) {
                return {
                    filters: {
                        custom_branch: frm.doc.to_branch
                    }
                };
            }
        });
    },
    scan_barcode: function(frm) {
        const serial_no = frm.doc.scan_barcode?.trim();
        if (!serial_no) return;
        if (!frm.doc.source_warehouse) {
            frappe.show_alert({
                message: "⚠️ Please select Source Warehouse first!",
                indicator: "orange"
            });
            frm.set_value("scan_barcode", "");
            return;
        }

        frappe.call({
            method: "frappe.client.get_value",
            args: {
                doctype: "Serial No",
                filters: { name: serial_no },
                fieldname: ["item_code", "item_name", "warehouse"]
            },
            callback: function(r) {
                if (!r.message) {
                    frappe.show_alert({
                        message: `❌ Serial No ${serial_no} not found!`,
                        indicator: 'red'
                    });
                    frm.set_value("scan_barcode", "");
                    return;
                }

                const { item_code, item_name, warehouse } = r.message;

                // 🚫 Skip if serial not in the selected source warehouse
                if (warehouse !== frm.doc.source_warehouse) {
                    frappe.show_alert({
                        message: `⛔ ${serial_no} is not available in ${frm.doc.source_warehouse}`,
                        indicator: 'red'
                    });
                    frm.set_value("scan_barcode", "");
                    return;
                }

                // ✅ Check if serial already exists in the table
                const already_exists = (frm.doc.items || []).some(
                    d => d.serial_nos === serial_no
                );

                if (already_exists) {
                    frappe.show_alert({
                        message: `⚠️ ${serial_no} already added!`,
                        indicator: 'orange'
                    });
                    frm.set_value("scan_barcode", "");
                    return;
                }

                // ✅ Fetch UOM and Rate from Item master
                frappe.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Item",
                        filters: { name: item_code },
                        fieldname: ["stock_uom", "valuation_rate"]
                    },
                    callback: function(item_r) {
                        let uom = item_r.message?.stock_uom || "Nos";
                        let rate = parseFloat(item_r.message?.valuation_rate || 0);
                        let qty = 1;

                        // Add new line
                        let row = frm.add_child("items");
                        row.item_code = item_code;
                        row.item_name = item_name;
                        row.serial_nos = serial_no;
                        row.uom = uom;
                        row.rate = rate;
                        row.qty = qty;
                        row.total = qty * rate;

                        frm.refresh_field("items");

                        frappe.show_alert({
                            message: `✅ Added ${serial_no} (${item_name})`,
                            indicator: 'green'
                        });

                        // Clear barcode field for next scan
                        frm.set_value("scan_barcode", "");
                    }
                });
            }
        });
}

});

frappe.ui.form.on("Packet Items", {
    qty: function(frm, cdt, cdn) {
        update_totals(frm, cdt, cdn);
    },
    rate: function(frm, cdt, cdn) {
        update_totals(frm, cdt, cdn);
    },
    item_code: function(frm, cdt, cdn) {
        update_totals(frm, cdt, cdn);
    }
});

// --- Function to calculate row total and total quantity ---
function update_totals(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    // Update row total
    if (row.qty != null && row.rate != null) {
        row.total = flt(row.qty) * flt(row.rate);
    } else {
        row.total = 0;
    }

    // Update total quantity
    let total_qty = 0;
    (frm.doc.items || []).forEach(item => {
        total_qty += flt(item.qty);
    });
    frm.set_value("total_quantity", total_qty);
    frm.refresh_field("items");
}






// frappe.ui.form.on("Packet Generator", {
//     scan_barcode: function(frm) {
//         const serial_no = frm.doc.scan_barcode?.trim();
//         if (!serial_no) return;

//         frappe.call({
//             method: "frappe.client.get_value",
//             args: {
//                 doctype: "Serial No",
//                 filters: { name: serial_no },
//                 fieldname: ["item_code", "item_name"]
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     const { item_code, item_name } = r.message;

//                     // Check if serial number already exists in the table
//                     const exists = (frm.doc.items || []).some(
//                         d => d.serial_no === serial_no
//                     );

//                     if (!exists) {
//                         let row = frm.add_child("items");
//                         row.item_code = item_code;
//                         row.item_name = item_name;
//                         row.serial_no = serial_no;
//                         frm.refresh_field("items");
//                         frappe.show_alert({
//                             message: `✅ Added ${serial_no} (${item_name})`,
//                             indicator: 'green'
//                         });
//                     } else {
//                         frappe.show_alert({
//                             message: `⚠️ ${serial_no} already added!`,
//                             indicator: 'orange'
//                         });
//                     }
//                 } else {
//                     frappe.show_alert({
//                         message: `❌ Serial No ${serial_no} not found!`,
//                         indicator: 'red'
//                     });
//                 }

//                 // Clear scan_barcode field for next scan
//                 frm.set_value("scan_barcode", "");
//             }
//         });
//     }
// });