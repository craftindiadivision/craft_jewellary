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
});
frappe.ui.form.on("Packet Items", {
    qty: function(frm, cdt, cdn) {
        update_total_quantity(frm);
    },
    item_code: function(frm, cdt, cdn) {
        update_total_quantity(frm);
    },
});

function update_total_quantity(frm) {
    let total = 0;
    (frm.doc.items || []).forEach(item => {
        total += flt(item.qty);
    });
    frm.set_value("total_quantity", total);
}