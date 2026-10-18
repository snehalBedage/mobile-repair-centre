
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.inventory.models import SparePart


class SparePartAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="inventory-admin@example.com",
            name="Inventory Admin",
            password="TestPassword@123",
            role="ADMIN",
        )
        self.client.force_authenticate(user=self.admin)
        self.url = reverse("spare-part-list-create")

    def test_admin_can_create_spare_part(self):
        response = self.client.post(
            self.url,
            {
                "part_name": "Test Screen",
                "part_code": "TEST-SCREEN-01",
                "quantity": 10,
                "unit_price": "1500.00",
                "reorder_level": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SparePart.objects.count(), 1)

    def test_spare_part_rejects_negative_price(self):
        response = self.client.post(
            self.url,
            {
                "part_name": "Invalid Screen",
                "part_code": "INVALID-SCREEN-01",
                "quantity": 10,
                "unit_price": "-100.00",
                "reorder_level": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SparePart.objects.count(), 0)

    def test_add_stock_updates_quantity(self):
        part = SparePart.objects.create(
            part_name="Test Battery",
            part_code="TEST-BATTERY-01",
            quantity=5,
            unit_price="500.00",
            reorder_level=2,
        )

        url = reverse(
            "spare-part-add-stock",
            kwargs={"pk": part.id},
        )

        response = self.client.post(
            url,
            {"quantity": 3},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        part.refresh_from_db()
        self.assertEqual(part.quantity, 8)

    def test_add_stock_rejects_zero_quantity(self):
        part = SparePart.objects.create(
            part_name="Test Charger",
            part_code="TEST-CHARGER-01",
            quantity=5,
            unit_price="300.00",
            reorder_level=2,
        )

        url = reverse(
            "spare-part-add-stock",
            kwargs={"pk": part.id},
        )

        response = self.client.post(
            url,
            {"quantity": 0},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        part.refresh_from_db()
        self.assertEqual(part.quantity, 5)
