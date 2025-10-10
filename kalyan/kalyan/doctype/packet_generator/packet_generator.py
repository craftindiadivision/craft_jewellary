from frappe.model.document import Document
import frappe

class PacketGenerator(Document):
    def before_save(self):
        self.total_quantity = sum(item.qty or 0 for item in (self.items or []))
        print(self.total_quantity)
