
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.customers.models import Customer, Device
from apps.repairs.models import Technician, JobCard, Estimate


class TechnicianAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="repairs-admin@example.com",
            name="Repairs Admin",
            password="TestPassword@123",
            role="ADMIN",
        )
        self.client.force_authenticate(user=self.admin)
        self.url = reverse("technician-list-create")

    def test_admin_can_create_technician(self):
        response = self.client.post(
            self.url,
            {
                "name": "Test Technician",
                "mobile": "9876543210",
                "email": "technician@example.com",
                "specialization": "Mobile Repair",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Technician.objects.count(), 1)

    def test_technician_rejects_invalid_mobile(self):
        response = self.client.post(
            self.url,
            {
                "name": "Test Technician",
                "mobile": "12345",
                "email": "technician@example.com",
                "specialization": "Mobile Repair",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Technician.objects.count(), 0)


class JobCardAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="jobcard-admin@example.com",
            name="Job Card Admin",
            password="TestPassword@123",
            role="ADMIN",
        )

        self.customer_user = User.objects.create_user(
            email="jobcard-customer@example.com",
            name="Test Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        self.customer = Customer.objects.create(
            user=self.customer_user,
            customer_code="TEST-CUST-001",
            name="Test Customer",
            mobile="9876543210",
            email=self.customer_user.email,
            address="Test Address",
        )

        self.device = Device.objects.create(
            customer=self.customer,
            brand="Samsung",
            model="Galaxy Test",
            imei="123456789012345",
            device_condition="Screen damaged",
        )

        self.technician = Technician.objects.create(
            name="Active Technician",
            mobile="9876543211",
            email="active-tech@example.com",
            specialization="Screen Repair",
            status=Technician.Status.ACTIVE,
        )

        self.client.force_authenticate(user=self.admin)
        self.url = reverse("job-card-list-create")

    def test_admin_can_create_job_card(self):
        response = self.client.post(
            self.url,
            {
                "customer": self.customer.id,
                "device": self.device.id,
                "technician": self.technician.id,
                "reported_problem": "Screen is damaged",
                "priority": "HIGH",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobCard.objects.count(), 1)

        job_card = JobCard.objects.get()
        self.assertEqual(job_card.customer, self.customer)
        self.assertEqual(job_card.status, JobCard.Status.RECEIVED)
        self.assertTrue(job_card.job_card_number)
        self.assertTrue(job_card.tracking_token)

    def test_job_card_rejects_device_of_another_customer(self):
        other_user = User.objects.create_user(
            email="other-customer@example.com",
            name="Other Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        other_customer = Customer.objects.create(
            user=other_user,
            customer_code="TEST-CUST-002",
            name="Other Customer",
            mobile="9876543212",
            email=other_user.email,
            address="Other Address",
        )

        other_device = Device.objects.create(
            customer=other_customer,
            brand="Apple",
            model="Test iPhone",
            imei="987654321012345",
            device_condition="Not turning on",
        )

        response = self.client.post(
            self.url,
            {
                "customer": self.customer.id,
                "device": other_device.id,
                "technician": self.technician.id,
                "reported_problem": "Phone not working",
                "priority": "MEDIUM",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(JobCard.objects.count(), 0)

    def test_job_card_rejects_inactive_technician(self):
        inactive_technician = Technician.objects.create(
            name="Inactive Technician",
            mobile="9876543213",
            email="inactive-tech@example.com",
            specialization="Mobile Repair",
            status=Technician.Status.INACTIVE,
        )

        response = self.client.post(
            self.url,
            {
                "customer": self.customer.id,
                "device": self.device.id,
                "technician": inactive_technician.id,
                "reported_problem": "Phone not working",
                "priority": "MEDIUM",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(JobCard.objects.count(), 0)


class PublicJobCardTrackingTests(APITestCase):

    def setUp(self):
        self.customer_user = User.objects.create_user(
            email="tracking-customer@example.com",
            name="Tracking Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        self.customer = Customer.objects.create(
            user=self.customer_user,
            customer_code="TRACK-CUST-001",
            name="Tracking Customer",
            mobile="9876543214",
            email=self.customer_user.email,
            address="Test Address",
        )

        self.device = Device.objects.create(
            customer=self.customer,
            brand="Samsung",
            model="Tracking Test",
            imei="111111111122222",
            device_condition="Screen damaged",
        )

        self.job_card = JobCard.objects.create(
            job_card_number="TRACK-JC-001",
            tracking_token="test-public-tracking-token",
            customer=self.customer,
            device=self.device,
            reported_problem="Screen damaged",
            status=JobCard.Status.REPAIR_IN_PROGRESS,
            priority=JobCard.Priority.MEDIUM,
            intake_date=timezone.now(),
        )

    def test_public_tracking_does_not_require_login(self):
        url = reverse(
            "job-card-public-tracking",
            kwargs={"tracking_token": self.job_card.tracking_token},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_tracking_rejects_unknown_token(self):
        url = reverse(
            "job-card-public-tracking",
            kwargs={"tracking_token": "unknown-tracking-token"},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
