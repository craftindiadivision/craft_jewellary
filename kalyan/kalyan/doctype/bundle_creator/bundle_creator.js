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
                fields: ["name", "item_group", "total_quantity","packet_uom","total_packet_value"]
            },
            callback: function(r) {
                if (r.message) {
                    r.message.forEach(d => {
                        let child = frm.add_child("packet_items");
                        child.packet_id = d.name;
                        child.item_group = d.item_group;
                        child.quantity = d.total_quantity;
                        child.uom = d.packet_uom;
                        child.packet_value = d.total_packet_value;
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

// function open_unbundle_dialog(frm) {
//     frappe.require('assets/frappe/js/lib/sortable.min.js', () => {
//         console.log("Opening Unbundle dialog...");

//         let d = new frappe.ui.Dialog({
//             title: 'Unbundle Packets (Drag & Drop / Barcode Scan)',
//             size: 'extra-large',
//             fields: [
//                 {
//                     fieldname: 'from_packet',
//                     label: 'From Packet',
//                     fieldtype: 'Link',
//                     options: 'Packet Generator',
//                     reqd: 1,
//                     get_query: function() {
//                         let packet_ids = (frm.doc.packet_items || []).map(i => i.packet_id);
//                         return { filters: { name: ['in', packet_ids] } };
//                     },
//                     onchange: () => render_packet_comparison(frm, d)
//                 },
//                 {
//                     fieldname: 'to_packet',
//                     label: 'To Packet',
//                     fieldtype: 'Link',
//                     options: 'Packet Generator',
//                     reqd: 1,
//                     get_query: function() {
//                         let packet_ids = (frm.doc.packet_items || []).map(i => i.packet_id);
//                         return { filters: { name: ['in', packet_ids] } };
//                     },
//                     onchange: () => render_packet_comparison(frm, d)
//                 },
//                 {
//                     fieldname: 'barcode',
//                     label: 'Scan Barcode',
//                     fieldtype: 'Data',
//                     placeholder: 'Scan item barcode here',
//                     onrender: function() {
//                         let input = this.$input.get(0);
//                         input.focus();

//                         input.addEventListener('keypress', function(e) {
//                             if (e.key === 'Enter') {
//                                 e.preventDefault();
//                                 let barcode = input.value.trim();
//                                 if (barcode) handle_barcode_scan(barcode, d);
//                             }
//                         });
//                     }
//                 },
//                 {
//                     fieldname: 'html_area',
//                     fieldtype: 'HTML',
//                     options: '<div id="packet-comparison" style="padding:10px;">Select packets to compare...</div>'
//                 }
//             ],
//             primary_action_label: 'Close',
//             primary_action() { d.hide(); }
//         });

//         d.show();
//         setTimeout(() => {
//             d.$wrapper.find('.modal-dialog').css({'max-width':'98%', 'width':'98%'});
//             d.$wrapper.find('.modal-content').css('height','90vh');
//         }, 200);
//     });
// }

// function render_packet_comparison(frm, dialog) {
//     let from_packet = dialog.get_value('from_packet');
//     let to_packet = dialog.get_value('to_packet');

//     if (!from_packet || !to_packet) {
//         dialog.get_field('html_area').$wrapper.html('<p class="text-muted">Select both packets to view items.</p>');
//         return;
//     }

//     Promise.all([
//         frappe.call({ method: "frappe.client.get", args: { doctype: "Packet Generator", name: from_packet } }),
//         frappe.call({ method: "frappe.client.get", args: { doctype: "Packet Generator", name: to_packet } })
//     ]).then(results => {
//         let from_doc = results[0].message;
//         let to_doc = results[1].message;

//         let from_items = from_doc.items || [];
//         let to_items = to_doc.items || [];

//         let html = `
//         <style>
//             .packet-card {
//                 flex:1;
//                 border-radius: 16px;
//                 background: rgba(255,255,255,0.1);
//                 backdrop-filter: blur(12px);
//                 -webkit-backdrop-filter: blur(12px);
//                 border: 1px solid rgba(255,255,255,0.2);
//                 box-shadow: 0 8px 32px rgba(0,0,0,0.1);
//                 padding: 20px;
//                 transition: transform 0.3s ease, box-shadow 0.3s ease;
//             }
//             .packet-card:hover {
//                 transform: translateY(-5px);
//                 box-shadow: 0 12px 32px rgba(0,0,0,0.2);
//             }
//             .packet-card h5 {
//                 background: linear-gradient(90deg, #4a90e2, #50e3c2);
//                 -webkit-background-clip: text;
//                 -webkit-text-fill-color: transparent;
//                 font-weight: 700;
//                 text-align: center;
//                 margin-bottom: 15px;
//                 font-size: 1.3em;
//             }
//             .packet-table {
//                 width: 100%;
//                 border-collapse: collapse;
//                 table-layout: auto;
//                 font-family: 'Inter', sans-serif;
//                 font-size: 0.95rem;
//             }
//             .packet-table th, .packet-table td {
//                 padding: 8px 12px;
//                 text-align: left;
//                 border-bottom: 1px solid rgba(0,0,0,0.1);
//                 word-break: break-word;
//             }
//             .packet-table th:nth-child(1), .packet-table td:nth-child(1) { width: 50%; }
//             .packet-table th:nth-child(2), .packet-table td:nth-child(2) { width: 30%; text-align: left; }
//             .packet-table th:nth-child(3), .packet-table td:nth-child(3) { width: 20%; text-align: center; }

//             .packet-table tbody tr {
//                 cursor: grab;
//                 transition: all 0.25s ease;
//                 border-radius: 8px;
//             }
//             .packet-table tbody tr:hover {
//                 background: rgba(74,144,226,0.05);
//             }
//             .packet-table tbody tr.dragging {
//                 background: #fffae6 !important;
//                 box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//             }
//         </style>

//         <div class="row" style="display:flex; gap:20px; flex-wrap: wrap;">
//             <div class="col-md-6 packet-card">
//                 <h5>${from_packet}</h5>
//                 <table class="packet-table">
//                     <thead>
//                         <tr><th>Item Name</th><th>SKU Code</th><th>Qty</th></tr>
//                     </thead>
//                     <tbody id="from-items">
//                         ${from_items.map(i => `
//                             <tr data-row="${i.name}">
//                                 <td>${i.item_name}</td>
//                                 <td>${i.sku_code || i.serial_nos || ''}</td>
//                                 <td>${i.qty}</td>
//                             </tr>`).join('')}
//                     </tbody>
//                 </table>
//             </div>

//             <div class="col-md-6 packet-card">
//                 <h5>${to_packet}</h5>
//                 <table class="packet-table">
//                     <thead>
//                         <tr><th>Item Name</th><th>SKU Code</th><th>Qty</th></tr>
//                     </thead>
//                     <tbody id="to-items">
//                         ${to_items.map(i => `
//                             <tr data-row="${i.name}">
//                                 <td>${i.item_name}</td>
//                                 <td>${i.sku_code || i.serial_nos || ''}</td>
//                                 <td>${i.qty}</td>
//                             </tr>`).join('')}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//         `;

//         dialog.get_field('html_area').$wrapper.html(html);

//         ['from-items','to-items'].forEach(id => {
//             new Sortable(document.getElementById(id), {
//                 group: 'packets',
//                 animation: 300,
//                 ghostClass: 'dragging',
//                 onStart: evt => evt.item.style.cursor = 'grabbing',
//                 onEnd: evt => evt.item.style.cursor = 'grab',
//                 onAdd: evt => {
//                     let target_packet = id === 'from-items' ? dialog.get_value('from_packet') : dialog.get_value('to_packet');
//                     let source_packet = id === 'from-items' ? dialog.get_value('to_packet') : dialog.get_value('from_packet');
//                     handle_drag(evt, target_packet, source_packet, dialog);
//                 }
//             });
//         });
//     });
// }

// function handle_barcode_scan(barcode, dialog) {
//     let from_packet = dialog.get_value('from_packet');
//     let to_packet = dialog.get_value('to_packet');

//     if (!from_packet || !to_packet) {
//         frappe.msgprint("Please select both packets first!");
//         dialog.set_value('barcode', '');
//         return;
//     }

//     frappe.call({
//         method: "frappe.client.get",
//         args: { doctype: "Packet Generator", name: from_packet },
//         callback: function(r) {
//             let from_doc = r.message;
//             if (!from_doc.items) return;

//             let item = from_doc.items.find(i => i.sku_code === barcode || i.serial_nos === barcode);
//             if (!item) {
//                 frappe.msgprint(`Item with barcode ${barcode} not found in ${from_packet}`);
//                 dialog.set_value('barcode', '');
//                 return;
//             }

//             swap_item_between_packets(from_packet, to_packet, item.name, dialog);
//             dialog.set_value('barcode', '');
//             dialog.fields_dict.barcode.$input.get(0).focus(); // auto focus again
//         }
//     });
// }

// function handle_drag(evt, target_packet, source_packet, dialog) {
//     let row_name = evt.item.dataset.row;
//     frappe.confirm(
//         `Move item from <b>${source_packet}</b> → <b>${target_packet}</b>?`,
//         () => swap_item_between_packets(source_packet, target_packet, row_name, dialog),
//         () => render_packet_comparison(null, dialog)
//     );
// }

// function swap_item_between_packets(from_packet, to_packet, row_name, dialog) {
//     frappe.call({
//         method: "frappe.client.get",
//         args: { doctype: "Packet Generator", name: from_packet },
//         callback: function(r) {
//             let from_doc = r.message;
//             if (!from_doc.items) return;

//             let item = from_doc.items.find(i => i.name === row_name);
//             if (!item) return frappe.msgprint(`Item not found in ${from_packet}`);

//             from_doc.items = from_doc.items.filter(i => i.name !== row_name);

//             frappe.call({
//                 method: "frappe.client.save",
//                 args: { doc: from_doc, ignore_mandatory: true },
//                 callback: function() {
//                     frappe.call({
//                         method: "frappe.client.get",
//                         args: { doctype: "Packet Generator", name: to_packet },
//                         callback: function(r2) {
//                             let to_doc = r2.message;
//                             to_doc.items = to_doc.items || [];

//                             let new_item = {
//                                 item_code: item.item_code,
//                                 item_name: item.item_name,
//                                 // sku_code: item.sku_code || '',
//                                 serial_nos: item.serial_nos || '',
//                                 qty: item.qty,
//                                 uom: item.uom || 'Nos'
//                             };

//                             to_doc.items.push(new_item);

//                             frappe.call({
//                                 method: "frappe.client.save",
//                                 args: { doc: to_doc },
//                                 callback: function() {
//                                     render_packet_comparison(null, dialog);
//                                 }
//                             });
//                         }
//                     });
//                 }
//             });
//         }
//     });
// }

function open_unbundle_dialog(frm) {
    frappe.require('assets/frappe/js/lib/sortable.min.js', () => {
        console.log("Opening Unbundle dialog...");

        let d = new frappe.ui.Dialog({
            title: 'Unbundle Packets (Drag & Drop)',
            size: 'extra-large',
            fields: [
                {
                    fieldname: 'from_packet',
                    label: 'From Packet',
                    fieldtype: 'Link',
                    options: 'Packet Generator',
                    reqd: 1,
                    get_query: function () {
                        let packet_ids = (frm.doc.packet_items || []).map(i => i.packet_id);
                        return { filters: { name: ['in', packet_ids] } };
                    },
                    onchange: () => render_packet_comparison(frm, d)
                },
                {
                    fieldname: 'to_packet',
                    label: 'To Packet',
                    fieldtype: 'Link',
                    options: 'Packet Generator',
                    reqd: 1,
                    get_query: function () {
                        let packet_ids = (frm.doc.packet_items || []).map(i => i.packet_id);
                        return { filters: { name: ['in', packet_ids] } };
                    },
                    onchange: () => render_packet_comparison(frm, d)
                },
                {
                    fieldname: 'barcode',
                    label: 'Scan Barcode',
                    fieldtype: 'Data',
                    options:'Barcode',
                    placeholder: 'Scan or enter barcode here',
                    onchange: function () {
                        let barcode = this.get_value();
                        if (!barcode) return;

                        let from_packet_name = d.get_value('from_packet');
                        let to_packet_name = d.get_value('to_packet');

                        if (!from_packet_name || !to_packet_name) {
                            frappe.msgprint("Select both packets first!");
                            return;
                        }

                        frappe.call({
                            method: "frappe.client.get",
                            args: { doctype: "Packet Generator", name: from_packet_name },
                            callback: function (r) {
                                let from_doc = r.message;
                                if (!from_doc.items) return;

                                let item = from_doc.items.find(i => i.serial_nos === barcode);
                                if (!item)
                                    return frappe.msgprint(`Item with barcode ${barcode} not found in ${from_packet_name}`);

                                swap_item_between_packets(from_packet_name, to_packet_name, item.name, d);
                                d.set_value('barcode', ''); 
                            }
                        });
                    },
                    onrender: function () {
                        $(this.$wrapper).find('input').on('keypress', function (e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();  // Prevent dialog from closing
                            }
                        });
                    }
},
                {
                    fieldname: 'html_area',
                    fieldtype: 'HTML',
                    options: '<div id="packet-comparison" style="padding:10px;">Select packets to compare...</div>'
                }
            ],
            primary_action_label: 'Close',
            primary_action() { d.hide(); }
        });

        d.show();

        setTimeout(() => {
            d.$wrapper.find('.modal-dialog').css({ 'max-width': '98%', 'width': '98%' });
            d.$wrapper.find('.modal-content').css('height', '90vh');
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
            .packet-card {
                flex: 1;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                padding: 20px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .packet-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
            }
            .packet-card h5 {
                background: linear-gradient(90deg, #4a90e2, #50e3c2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
                text-align: center;
                margin-bottom: 15px;
                font-size: 1.3em;
            }
            .packet-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: auto;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
            }
            .packet-table th, .packet-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                word-break: break-word;
            }
            .packet-table th:nth-child(1),
            .packet-table td:nth-child(1) { width: 50%; }
            .packet-table th:nth-child(2),
            .packet-table td:nth-child(2) { width: 30%; text-align: left; }
            .packet-table th:nth-child(3),
            .packet-table td:nth-child(3) { width: 20%; text-align: center; }
            .packet-table tbody tr {
                cursor: grab;
                transition: all 0.25s ease;
                border-radius: 8px;
            }
            .packet-table tbody tr:hover {
                background: rgba(74,144,226,0.05);
            }
            .packet-table tbody tr.dragging {
                background: #fffae6 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
        </style>

        <div class="row" style="display:flex; gap:20px; flex-wrap: wrap;">
            <div class="col-md-6 packet-card">
                <h5>${from_packet}</h5>
                <table class="packet-table">
                    <thead>
                        <tr><th>Item Name</th><th>SKU Code</th><th>Qty</th></tr>
                    </thead>
                    <tbody id="from-items">
                        ${from_items.map(i =>
                            `<tr data-row="${i.name}">
                                <td>${i.item_name}</td>
                                <td>${i.serial_nos || ''}</td>
                                <td>${i.qty}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="col-md-6 packet-card">
                <h5>${to_packet}</h5>
                <table class="packet-table">
                    <thead>
                        <tr><th>Item Name</th><th>SKU Code</th><th>Qty</th></tr>
                    </thead>
                    <tbody id="to-items">
                        ${to_items.map(i =>
                            `<tr data-row="${i.name}">
                                <td>${i.item_name}</td>
                                <td>${i.serial_nos || ''}</td>
                                <td>${i.qty}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;

        dialog.get_field('html_area').$wrapper.html(html);

        ['from-items', 'to-items'].forEach(id => {
            new Sortable(document.getElementById(id), {
                group: 'packets',
                animation: 300,
                ghostClass: 'dragging',
                onStart: evt => evt.item.style.cursor = 'grabbing',
                onEnd: evt => evt.item.style.cursor = 'grab',
                onAdd: evt => {
                    let target_packet = id === 'from-items' ? dialog.get_value('from_packet') : dialog.get_value('to_packet');
                    let source_packet = id === 'from-items' ? dialog.get_value('to_packet') : dialog.get_value('from_packet');
                    handle_drag(evt, target_packet, source_packet, dialog);
                }
            });
        });
    });
}

function handle_drag(evt, target_packet, source_packet, dialog) {
    let row_name = evt.item.dataset.row;
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
        callback: function (r) {
            let from_doc = r.message;
            if (!from_doc.items) return;

            let item = from_doc.items.find(i => i.name === row_name);
            if (!item)
                return frappe.msgprint(`Item not found in ${from_packet}`);

            from_doc.items = from_doc.items.filter(i => i.name !== row_name);

            frappe.call({
                method: "frappe.client.save",
                args: { doc: from_doc, ignore_mandatory: true },
                callback: function () {
                    frappe.call({
                        method: "frappe.client.get",
                        args: { doctype: "Packet Generator", name: to_packet },
                        callback: function (r2) {
                            let to_doc = r2.message;
                            to_doc.items = to_doc.items || [];

                            let new_item = {
                                item_code: item.item_code,
                                item_name: item.item_name,
                                serial_nos: item.serial_nos || '',
                                qty: item.qty,
                                uom: item.uom || 'Nos'
                            };

                            to_doc.items.push(new_item);

                            frappe.call({
                                method: "frappe.client.save",
                                args: { doc: to_doc },
                                callback: function () {
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



frappe.ui.form.on("Bundle Creator", {
    refresh: function(frm) {
        // Filter source_warehouse based on from_branch
        frm.set_query("from_warehouse", function() {
            if (frm.doc.from_branch) {
                return {
                    filters: {
                        custom_branch: frm.doc.from_branch
                    }
                };
            }
        });
        frm.set_query("to_warehouse", function() {
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