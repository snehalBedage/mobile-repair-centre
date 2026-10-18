
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


class ReportsAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="reports-admin@example.com",
            name="Reports Admin",
            password="TestPassword@123",
            role="ADMIN",
        )

        self.staff = User.objects.create_user(
            email="reports-staff@example.com",
            name="Reports Staff",
            password="TestPassword@123",
            role="STAFF",
        )

        self.customer = User.objects.create_user(
            email="reports-customer@example.com",
            name="Reports Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

    def test_admin_can_access_dashboard_summary(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse("dashboard-summary")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            getattr(response, "data", None),
        )

    def test_customer_cannot_access_dashboard_summary(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("dashboard-summary")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_access_job_card_status_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse("job-card-status-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            getattr(response, "data", None),
        )

    def test_customer_cannot_access_job_card_status_report(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("job-card-status-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_access_revenue_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse("revenue-payment-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            getattr(response, "data", None),
        )

    def test_customer_cannot_access_revenue_report(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("revenue-payment-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_access_inventory_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse("inventory-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            getattr(response, "data", None),
        )

    def test_customer_cannot_access_inventory_report(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("inventory-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_access_repair_performance_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse("repair-performance-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            getattr(response, "data", None),
        )

    def test_customer_cannot_access_repair_performance_report(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.get(
            reverse("repair-performance-report")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
