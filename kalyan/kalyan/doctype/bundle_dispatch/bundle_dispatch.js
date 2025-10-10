// Copyright (c) 2025, craft and contributors
// For license information, please see license.txt
frappe.ui.form.on('Bundle Dispatch', {
    from_warehouse: fetch_matching_bundles,
    to_warehouse: fetch_matching_bundles,
    route: fetch_matching_bundles,
    to_be_delivered: fetch_matching_bundles
});

function fetch_matching_bundles(frm) {
    // Only run when all 4 fields are filled
    if (frm.doc.from_warehouse && frm.doc.to_warehouse && frm.doc.route && frm.doc.to_be_delivered) {
        frappe.call({
            method: "kalyan.kalyan.doctype.bundle_dispatch.bundle_dispatch.get_matching_bundles",
            args: {
                from_warehouse: frm.doc.from_warehouse,
                to_warehouse: frm.doc.to_warehouse,
                route: frm.doc.route,
                to_be_delivered: frm.doc.to_be_delivered
            },
            callback: function(r) {
                frm.clear_table("bundles");

                if (r.message && r.message.length > 0) {
                    // Add matching bundles
                    r.message.forEach(b => {
                        let row = frm.add_child("bundles");
                        row.bundle = b.name;
                    });

                    frm.refresh_field("bundles");
                    frappe.show_alert({
                        message: `${r.message.length} bundles loaded successfully`,
                        indicator: "green"
                    });
                } else {
                    frm.refresh_field("bundles");
                    frappe.show_alert({
                        message: "No matching bundles found",
                        indicator: "orange"
                    });
                }
            }
        });
    }
}
frappe.ui.form.on('Bundle Dispatch', {
    refresh: function(frm) {
        // Show E-Way Bill button always (or you can conditionally show it)
        frm.add_custom_button(__('E-Way Bill'), function() {
            frappe.msgprint(__('E-Way Bill button clicked!'));
        });
    }
});
