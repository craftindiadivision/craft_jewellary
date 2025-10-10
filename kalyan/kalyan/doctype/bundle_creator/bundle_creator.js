frappe.ui.form.on("Bundle Creator", {
    to_be_delivered: function(frm) {
        if (!frm.doc.to_be_delivered) return;

        // Clear existing rows first (optional)
        frm.clear_table("packet_items");

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Packet Generator",
                filters: {
                    to_be_delivered: 1,
                    to_be_delivered: frm.doc.to_be_delivered  // optional if you want same date filter
                },
                fields: ["name", "item_group", "total_quantity","packet_uom"]
            },
            callback: function(r) {
                if (r.message) {
                    r.message.forEach(d => {
                        let child = frm.add_child("packet_items");
                        child.packet_id = d.name;
                        child.item_group = d.item_group;
                        child.quantity = d.total_quantity;
                        child.uom = d.packet_uom;
                    });
                    frm.refresh_field("packet_items");
                }
            }
        });
    }
});
frappe.ui.form.on('Bundle Creator', {
    refresh: function(frm) {
        if (!frm.doc.__islocal) {
            // Add 'Unbundle' button directly on the form
            frm.add_custom_button('Unbundle', function() {
                open_unbundle_dialog(frm);
            });
        }
    }
});


// --- Your existing functions ---
function open_unbundle_dialog(frm) {
    frappe.require('assets/frappe/js/lib/sortable.min.js', () => {
        console.log("Opening Unbundle dialog...");

        let d = new frappe.ui.Dialog({
            title: 'Unbundle Packets (Drag & Drop)',
            size: 'extra-large',
            fields: [
                { fieldname: 'from_packet', label: 'From Packet', fieldtype: 'Link', options: 'Packet Generator', reqd: 1, onchange: () => render_packet_comparison(frm, d) },
                { fieldname: 'to_packet', label: 'To Packet', fieldtype: 'Link', options: 'Packet Generator', reqd: 1, onchange: () => render_packet_comparison(frm, d) },
                { fieldname: 'html_area', fieldtype: 'HTML', options: '<div id="packet-comparison" style="padding:10px;">Select packets to compare...</div>' }
            ],
            primary_action_label: 'Close',
            primary_action() { d.hide(); }
        });

        d.show();
        console.log("Dialog shown");

        setTimeout(() => {
            d.$wrapper.find('.modal-dialog').css({'max-width':'98%', 'width':'98%'});
            d.$wrapper.find('.modal-content').css('height','90vh');
        }, 200);
    });
}

function render_packet_comparison(frm, dialog) {
    let from_packet = dialog.get_value('from_packet');
    let to_packet = dialog.get_value('to_packet');

    if (!from_packet || !to_packet) {
        dialog.get_field('html_area').$wrapper.html('<p class="text-muted">Select both packets to view items.</p>');
        return;
    }

    Promise.all([
        frappe.call({ method: "frappe.client.get", args: { doctype: "Packet Generator", name: from_packet } }),
        frappe.call({ method: "frappe.client.get", args: { doctype: "Packet Generator", name: to_packet } })
    ]).then(results => {
        let from_doc = results[0].message;
        let to_doc = results[1].message;

        let from_items = from_doc.items || [];
        let to_items = to_doc.items || [];

        let html = `
        <style>
            /* Glassmorphism packet cards */
            .packet-card {
                flex:1;
                border-radius: 16px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                padding: 20px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .packet-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 32px rgba(0,0,0,0.2);
            }

            /* Gradient headers */
            .packet-card h5 {
                background: linear-gradient(90deg, #4a90e2, #50e3c2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
                text-align: center;
                margin-bottom: 15px;
                font-size: 1.3em;
            }

            /* Table styling */
            .packet-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
            }
            .packet-table thead th {
                background: rgba(255,255,255,0.15);
                backdrop-filter: blur(6px);
                padding: 8px;
                text-align: center;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .packet-table tbody tr {
                cursor: grab;
                transition: all 0.25s ease;
                border-radius: 8px;
            }
            .packet-table tbody tr:hover {
                background: rgba(74,144,226,0.1);
                transform: scale(1.02);
            }
            .packet-table tbody tr.dragging {
                background: #fffae6 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        </style>

        <div class="row" style="display:flex; gap:20px; flex-wrap: wrap;">
            <div class="col-md-6 packet-card">
                <h5>${from_packet}</h5>
                <table class="table packet-table">
                    <thead>
                        <tr><th>Item Name</th><th>Qty</th></tr>
                    </thead>
                    <tbody id="from-items">
                        ${from_items.map(i => `<tr data-row="${i.name}"><td>${i.item_name}</td><td>${i.qty}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>

            <div class="col-md-6 packet-card">
                <h5>${to_packet}</h5>
                <table class="table packet-table">
                    <thead>
                        <tr><th>Item Name</th><th>Qty</th></tr>
                    </thead>
                    <tbody id="to-items">
                        ${to_items.map(i => `<tr data-row="${i.name}"><td>${i.item_name}</td><td>${i.qty}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;

        dialog.get_field('html_area').$wrapper.html(html);

        // Initialize Sortable with advanced visual effects
        ['from-items','to-items'].forEach(id => {
            new Sortable(document.getElementById(id), {
                group: 'packets',
                animation: 300,
                ghostClass: 'dragging',
                onStart: function(evt) { evt.item.style.cursor = 'grabbing'; },
                onEnd: function(evt) { evt.item.style.cursor = 'grab'; },
                onAdd: function(evt) {
                    let target_packet = id === 'from-items' ? dialog.get_value('from_packet') : dialog.get_value('to_packet');
                    let source_packet = id === 'from-items' ? dialog.get_value('to_packet') : dialog.get_value('from_packet');
                    handle_drag(evt, target_packet, source_packet, dialog);
                }
            });
        });
    });
}


function handle_drag(evt, target_packet, source_packet, dialog) {
    let row_name = evt.item.dataset.row; // Use child table row name
    frappe.confirm(
        `Move item from <b>${source_packet}</b> → <b>${target_packet}</b>?`,
        () => swap_item_between_packets(source_packet, target_packet, row_name, dialog),
        () => render_packet_comparison(null, dialog)
    );
}

function swap_item_between_packets(from_packet, to_packet, row_name, dialog) {
    frappe.call({
        method: "frappe.client.get",
        args: { doctype: "Packet Generator", name: from_packet },
        callback: function(r) {
            let from_doc = r.message;
            if (!from_doc.items) return;

            let item = from_doc.items.find(i => i.name === row_name);
            if (!item) return frappe.msgprint(`Item not found in ${from_packet}`);

            // Remove only the selected line
            from_doc.items = from_doc.items.filter(i => i.name !== row_name);

            frappe.call({
                method: "frappe.client.save",
                args: { doc: from_doc, ignore_mandatory: true },
                callback: function() {
                    frappe.call({
                        method: "frappe.client.get",
                        args: { doctype: "Packet Generator", name: to_packet },
                        callback: function(r2) {
                            let to_doc = r2.message;
                            to_doc.items = to_doc.items || [];

                            let new_item = {
                                item_code: item.item_code,
                                item_name: item.item_name,
                                qty: item.qty,
                                uom: item.uom || 'Nos'
                            };

                            to_doc.items.push(new_item);

                            frappe.call({
                                method: "frappe.client.save",
                                args: { doc: to_doc },
                                callback: function() {
                                    // frappe.msgprint(`Item <b>${item.item_name}</b> moved successfully.`);
                                    render_packet_comparison(null, dialog);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}
