# Copyright (c) 2025, craft and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class BundleCreator(Document):
	def before_save(self):
		self.total_bundle_value = sum(item.packet_value or 0 for item in (self.packet_items or []))
		print(self.total_bundle_value)
