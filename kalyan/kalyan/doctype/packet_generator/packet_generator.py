from frappe.model.document import Document
import frappe

class PacketGenerator(Document):
    def before_save(self):
        self.total_quantity = sum(item.qty or 0 for item in (self.items or []))
        self.total_packet_value = sum(item.total or 0 for item in (self.items or []))
        print(self.total_quantity)


    def validate(self):
            self.check_duplicate_serial_no()

    def check_duplicate_serial_no(self):
        """Ensure no Serial No is already used in another Packet Generator"""
        existing_serials = []

        for item in self.items:
            if not item.serial_nos:
                continue

            # Check if this serial number exists in another Packet Generator
            existing = frappe.db.sql("""
                SELECT parent
                FROM `tabPacket Items`
                WHERE serial_nos = %s
                AND parent != %s
            """, (item.serial_nos, self.name))

            if existing:
                existing_serials.append(f"{item.serial_nos} (in {existing[0][0]})")

        if existing_serials:
            frappe.throw(
                "The following Serial Nos are already used in another Packet Generator:<br><br>"
                + "<br>".join(existing_serials)
            )
