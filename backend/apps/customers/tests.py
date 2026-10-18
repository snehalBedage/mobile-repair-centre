
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from apps.accounts.models import User
from apps.customers.models import Customer, Device


class CustomerAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_user(
            email="admin-test@example.com",
            name="Test Admin",
            password="TestPassword@123",
            role="ADMIN",
        )

        # First customer user
        self.customer_user = User.objects.create_user(
            email="customer-test@example.com",
            name="Test Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        # Second customer user
        self.other_customer_user = User.objects.create_user(
            email="other-customer@example.com",
            name="Other Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        # Customer profile
        self.customer = Customer.objects.create(
            user=self.customer_user,
            customer_code=f"CUST{self.customer_user.id:05d}",
            name="Test Customer",
            mobile="9876543210",
            email=self.customer_user.email,
            address="Test Address",
        )

        self.other_customer = Customer.objects.create(
            user=self.other_customer_user,
            customer_code=f"CUST{self.other_customer_user.id:05d}",
            name="Other Customer",
            mobile="9876543211",
            email=self.other_customer_user.email,
            address="Other Address",
        )

        self.customer_url = reverse("customer-list-create")

    def test_admin_can_view_all_customers(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.customer_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Supports both paginated and non-paginated responses
        if isinstance(response.data, dict) and "results" in response.data:
            customers = response.data["results"]
        else:
            customers = response.data

        self.assertEqual(len(customers), 2)

    def test_customer_can_view_own_profile_only(self):
        self.client.force_authenticate(user=self.customer_user)

        response = self.client.get(self.customer_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if isinstance(response.data, dict) and "results" in response.data:
            customers = response.data["results"]
        else:
            customers = response.data

        self.assertEqual(len(customers), 1)
        self.assertEqual(
            customers[0]["id"],
            self.customer.id,
        )

    def test_customer_cannot_view_other_customer_profile(self):
        self.client.force_authenticate(user=self.customer_user)

        url = reverse(
            "customer-detail",
            kwargs={"pk": self.other_customer.id},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_create_customer_profile(self):
        self.client.force_authenticate(user=self.admin)

        new_user = User.objects.create_user(
            email="new-customer@example.com",
            name="New Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        response = self.client.post(
            self.customer_url,
            {
                "user": new_user.id,
                "name": "New Customer",
                "mobile": "9876543212",
                "email": "new-customer@example.com",
                "address": "New Address",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Customer.objects.filter(user=new_user).exists()
        )


class DeviceAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email="device-admin@example.com",
            name="Device Admin",
            password="TestPassword@123",
            role="ADMIN",
        )

        customer_user = User.objects.create_user(
            email="device-customer@example.com",
            name="Device Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        self.customer = Customer.objects.create(
            user=customer_user,
            customer_code=f"CUST{customer_user.id:05d}",
            name="Device Customer",
            mobile="9876543213",
            email=customer_user.email,
            address="Device Address",
        )

        self.device_url = reverse("device-list-create")

    def test_admin_can_create_device_with_valid_imei(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.device_url,
            {
                "customer": self.customer.id,
                "brand": "Samsung",
                "model": "Galaxy A55",
                "imei": "123456789012345",
                "device_condition": "Screen damaged",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Device.objects.filter(imei="123456789012345").exists()
        )

    def test_device_creation_rejects_invalid_imei(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.device_url,
            {
                "customer": self.customer.id,
                "brand": "Samsung",
                "model": "Galaxy A55",
                "imei": "12345",
                "device_condition": "Screen damaged",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("imei", response.data)
