// Copyright (c) 2025, craft and contributors
// For license information, please see license.txt

frappe.ui.form.on("Received Bundle", {
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button('Unbundle', function() {

                // Use get_mapped_doc to create Unbundling document
                frappe.model.with_doctype("Unbundling", function() {
                    frappe.model.open_mapped_doc({
                        method: "kalyan.kalyan.doctype.received_bundle.received_bundle.unbundle_bundles",
                        source_name: frm.doc.name,
                        frm: frm
                    });
                });

            });
        }
    }
});

