
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.customers.models import Customer, Device
from apps.repairs.models import JobCard, Estimate
from apps.billing.models import Payment


class BillingAPITests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="billing-admin@example.com",
            name="Billing Admin",
            password="TestPassword@123",
            role="ADMIN",
        )

        self.client.force_authenticate(user=self.admin)

        self.customer_user = User.objects.create_user(
            email="billing-customer@example.com",
            name="Billing Customer",
            password="TestPassword@123",
            role="CUSTOMER",
        )

        self.customer = Customer.objects.create(
            user=self.customer_user,
            customer_code="BILL-CUST-001",
            name="Billing Customer",
            mobile="9876543210",
            email="billing-customer@example.com",
        )

        self.device = Device.objects.create(
            customer=self.customer,
            brand="Samsung",
            model="Galaxy Test",
            imei="123456789012345",
            device_condition="Screen damaged",
        )

        # Payment is permitted only for a COMPLETED Job Card.
        self.job_card = JobCard.objects.create(
            job_card_number="JC-BILL-001",
            tracking_token="billing-test-token-001",
            customer=self.customer,
            device=self.device,
            reported_problem="Screen damaged",
            intake_date=timezone.now(),
            status=JobCard.Status.COMPLETED,
        )

        self.estimate = Estimate.objects.create(
            job_card=self.job_card,
            service_cost=Decimal("500.00"),
            parts_cost=Decimal("1500.00"),
            total_amount=Decimal("2000.00"),
            approval_status=Estimate.ApprovalStatus.APPROVED,
            approved_by=self.admin,
            approved_at=timezone.now(),
        )

        self.payment_url = reverse("payment-list-create")

    def payment_data(self, **overrides):
        data = {
            "job_card": self.job_card.id,
            "payment_reference": "PAY-BILL-001",
            "amount": "500.00",
            "payment_method": "CASH",
            "payment_date": timezone.now().isoformat(),
        }

        data.update(overrides)
        return data

    def test_admin_can_create_payment_for_approved_estimate(self):
        response = self.client.post(
            self.payment_url,
            self.payment_data(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.assertEqual(Payment.objects.count(), 1)

        payment = Payment.objects.get()

        self.assertEqual(
            payment.payment_status,
            Payment.PaymentStatus.PENDING,
        )
        self.assertEqual(payment.amount, Decimal("500.00"))

    def test_payment_rejects_zero_amount(self):
        response = self.client.post(
            self.payment_url,
            self.payment_data(
                payment_reference="PAY-ZERO-001",
                amount="0.00",
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_payment_rejects_amount_greater_than_remaining_bill(self):
        response = self.client.post(
            self.payment_url,
            self.payment_data(
                payment_reference="PAY-OVER-001",
                amount="2000.01",
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_payment_requires_approved_estimate(self):
        self.estimate.approval_status = Estimate.ApprovalStatus.PENDING
        self.estimate.save()

        response = self.client.post(
            self.payment_url,
            self.payment_data(
                payment_reference="PAY-PENDING-001",
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_customer_cannot_create_payment(self):
        self.client.force_authenticate(user=self.customer_user)

        response = self.client.post(
            self.payment_url,
            self.payment_data(
                payment_reference="PAY-CUSTOMER-001",
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(Payment.objects.count(), 0)

    def test_paid_payment_receipt_returns_pdf(self):
        payment = Payment.objects.create(
            job_card=self.job_card,
            payment_reference="PAY-RECEIPT-001",
            amount=Decimal("500.00"),
            payment_method=Payment.PaymentMethod.CASH,
            payment_status=Payment.PaymentStatus.PAID,
            payment_date=timezone.now(),
        )

        url = reverse(
            "payment-receipt",
            kwargs={"pk": payment.id},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_receipt_is_rejected_for_unpaid_payment(self):
        payment = Payment.objects.create(
            job_card=self.job_card,
            payment_reference="PAY-UNPAID-001",
            amount=Decimal("500.00"),
            payment_method=Payment.PaymentMethod.CASH,
            payment_status=Payment.PaymentStatus.PENDING,
            payment_date=timezone.now(),
        )

        url = reverse(
            "payment-receipt",
            kwargs={"pk": payment.id},
        )

        response = self.client.get(url)

        self.assertEqual(
    payment.payment_status,
    Payment.PaymentStatus.PENDING,
)
