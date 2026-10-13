from decimal import Decimal

from django.db.models import Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from apps.repairs.models import JobCard
from .models import Payment
from .serializers import PaymentSerializer
from apps.reports.audit import create_audit_log


class BillingSummaryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, job_card_id):

        job_card = get_object_or_404(
            JobCard.objects.select_related(
                'customer',
                'device'
            ),
            id=job_card_id
        )

        # Customer can view only their own Job Card
        if request.user.role == 'CUSTOMER':

            if job_card.customer.user != request.user:

                return Response(
                    {
                        "detail": (
                            "You do not have permission to "
                            "view this billing information."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role not in ['ADMIN', 'STAFF']:

            return Response(
                {
                    "detail": (
                        "You do not have permission to "
                        "view billing information."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Get latest approved estimate
        estimate = job_card.estimates.filter(
            approval_status='APPROVED'
        ).order_by('-id').first()

        if not estimate:

            return Response(
                {
                    "detail": (
                        "Approved estimate not found "
                        "for this Job Card."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        total_bill = estimate.total_amount

        # Calculate total paid amount
        paid_amount = job_card.payments.filter(
            payment_status=Payment.PaymentStatus.PAID
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        remaining_amount = total_bill - paid_amount

        if paid_amount == Decimal('0.00'):

            billing_status = 'UNPAID'

        elif paid_amount < total_bill:

            billing_status = 'PARTIAL'

        else:

            billing_status = 'PAID'

        return Response(
            {
                "job_card_id": job_card.id,
                "job_card_number": job_card.job_card_number,
                "customer": job_card.customer.name,
                "device": (
                    f"{job_card.device.brand} "
                    f"{job_card.device.model}"
                ),
                "total_bill": total_bill,
                "paid_amount": paid_amount,
                "remaining_amount": remaining_amount,
                "billing_status": billing_status,
            },
            status=status.HTTP_200_OK
        )


class PaymentListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # =====================================================
        # GET PAYMENTS - ROLE BASED ACCESS
        # =====================================================

        if request.user.role == 'CUSTOMER':

            payments = Payment.objects.filter(
                job_card__customer__user=request.user
            ).select_related(
                'job_card'
            )

        elif request.user.role in ['ADMIN', 'STAFF']:

            payments = Payment.objects.all().select_related(
                'job_card'
            )

        else:

            return Response(
                {
                    "detail": (
                        "You do not have permission "
                        "to view payments."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # =====================================================
        # SEARCH
        # =====================================================

        search = request.query_params.get('search')

        if search:

            payments = payments.filter(
                payment_reference__icontains=search
            ) | payments.filter(
                job_card__job_card_number__icontains=search
            ) | payments.filter(
                payment_method__icontains=search
            ) | payments.filter(
                payment_status__icontains=search
            )

        # =====================================================
        # ORDERING
        # =====================================================

        payments = payments.order_by('-id')

        # =====================================================
        # PAGINATION
        # =====================================================

        paginator = PageNumberPagination()
        paginator.page_size = 10

        paginated_payments = paginator.paginate_queryset(
            payments,
            request
        )

        serializer = PaymentSerializer(
            paginated_payments,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    # =====================================================
    # CREATE PAYMENT
    # =====================================================

    def post(self, request):

        # Customer cannot create payment records
        if request.user.role == 'CUSTOMER':

            return Response(
                {
                    "detail": (
                        "Customers cannot create "
                        "payment records."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role not in ['ADMIN', 'STAFF']:

            return Response(
                {
                    "detail": (
                        "You do not have permission "
                        "to create payments."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PaymentSerializer(
            data=request.data
        )

        if serializer.is_valid():

            payment = serializer.save()

            create_audit_log(
                user=request.user,
                action=f"Payment created - {payment.payment_reference}",
                table_name="PAYMENTS",
                record_id=payment.id
            )

            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PaymentDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):

        return get_object_or_404(
            Payment.objects.select_related(
                'job_card',
                'job_card__customer'
            ),
            id=pk
        )

    def get(self, request, pk):

        payment = self.get_object(pk)

        # Customer can see only own payment
        if request.user.role == 'CUSTOMER':

            if payment.job_card.customer.user != request.user:

                return Response(
                    {
                        "detail": (
                            "You do not have permission "
                            "to view this payment."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role not in ['ADMIN', 'STAFF']:

            return Response(
                {
                    "detail": (
                        "You do not have permission "
                        "to view this payment."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PaymentSerializer(payment)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def patch(self, request, pk):

        payment = self.get_object(pk)

        # Only ADMIN and STAFF can update payment status
        if request.user.role not in ['ADMIN', 'STAFF']:

            return Response(
                {
                    "detail": (
                        "You do not have permission "
                        "to update payment status."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('payment_status')

        if new_status not in [
            Payment.PaymentStatus.PAID,
            Payment.PaymentStatus.FAILED
        ]:

            return Response(
                {
                    "payment_status": (
                        "Choose PAID or FAILED."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if payment.payment_status != Payment.PaymentStatus.PENDING:

            return Response(
                {
                    "detail": (
                        "Only PENDING payments can be updated."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.payment_status = new_status
        payment.save(update_fields=['payment_status'])

        serializer = PaymentSerializer(payment)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class PaymentReceiptView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        payment = get_object_or_404(
            Payment.objects.select_related(
                'job_card',
                'job_card__customer',
                'job_card__device'
            ),
            id=pk
        )

        # Customer can access only own receipt
        if request.user.role == 'CUSTOMER':

            if payment.job_card.customer.user != request.user:

                return Response(
                    {
                        "detail": (
                            "You do not have permission "
                            "to access this receipt."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role not in ['ADMIN', 'STAFF']:

            return Response(
                {
                    "detail": (
                        "You do not have permission "
                        "to access this receipt."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Receipt is available only for successful payments
        if payment.payment_status != Payment.PaymentStatus.PAID:

            return Response(
                {
                    "detail": (
                        "Receipt is available only "
                        "for successful payments."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        job_card = payment.job_card
        customer = job_card.customer
        device = job_card.device

        # Create PDF response
        response = HttpResponse(
            content_type='application/pdf'
        )

        response[
            'Content-Disposition'
        ] = (
            f'attachment; '
            f'filename="Receipt_{payment.payment_reference}.pdf"'
        )

        # PDF document
        document = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=styles['Title'],
            alignment=TA_CENTER,
            fontSize=20,
            spaceAfter=8,
        )

        subtitle_style = ParagraphStyle(
            'ReceiptSubtitle',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=10,
            spaceAfter=20,
        )

        normal_style = ParagraphStyle(
            'ReceiptNormal',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
        )

        amount_style = ParagraphStyle(
            'ReceiptAmount',
            parent=styles['Normal'],
            fontSize=12,
            leading=16,
        )

        story = []

        # Header
        story.append(
            Paragraph(
                "MOBILE REPAIR CENTRE",
                title_style
            )
        )

        story.append(
            Paragraph(
                "PAYMENT RECEIPT",
                subtitle_style
            )
        )

        # Receipt information
        receipt_data = [
            [
                Paragraph("<b>Receipt No.</b>", normal_style),
                Paragraph(
                    payment.payment_reference,
                    normal_style
                ),
            ],
            [
                Paragraph("<b>Job Card No.</b>", normal_style),
                Paragraph(
                    job_card.job_card_number,
                    normal_style
                ),
            ],
            [
                Paragraph("<b>Payment Date</b>", normal_style),
                Paragraph(
                    payment.payment_date.strftime(
                        "%d-%m-%Y %I:%M %p"
                    ),
                    normal_style
                ),
            ],
            [
                Paragraph("<b>Payment Method</b>", normal_style),
                Paragraph(
                    payment.get_payment_method_display(),
                    normal_style
                ),
            ],
            [
                Paragraph("<b>Payment Status</b>", normal_style),
                Paragraph(
                    payment.get_payment_status_display(),
                    normal_style
                ),
            ],
        ]

        receipt_table = Table(
            receipt_data,
            colWidths=[55 * mm, 105 * mm]
        )

        receipt_table.setStyle(
            TableStyle(
                [
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'BACKGROUND',
                        (0, 0),
                        (0, -1),
                        colors.lightgrey
                    ),
                    (
                        'VALIGN',
                        (0, 0),
                        (-1, -1),
                        'MIDDLE'
                    ),
                    (
                        'LEFTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'RIGHTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'TOPPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'BOTTOMPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                ]
            )
        )

        story.append(receipt_table)
        story.append(Spacer(1, 15))

        # Customer details
        story.append(
            Paragraph(
                "<b>CUSTOMER DETAILS</b>",
                normal_style
            )
        )

        story.append(Spacer(1, 5))

        customer_data = [
            [
                Paragraph("<b>Name</b>", normal_style),
                Paragraph(customer.name, normal_style),
            ],
            [
                Paragraph("<b>Mobile</b>", normal_style),
                Paragraph(customer.mobile, normal_style),
            ],
            [
                Paragraph("<b>Email</b>", normal_style),
                Paragraph(
                    customer.email or "-",
                    normal_style
                ),
            ],
        ]

        customer_table = Table(
            customer_data,
            colWidths=[55 * mm, 105 * mm]
        )

        customer_table.setStyle(
            TableStyle(
                [
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'BACKGROUND',
                        (0, 0),
                        (0, -1),
                        colors.lightgrey
                    ),
                    (
                        'VALIGN',
                        (0, 0),
                        (-1, -1),
                        'MIDDLE'
                    ),
                    (
                        'LEFTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'RIGHTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'TOPPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'BOTTOMPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                ]
            )
        )

        story.append(customer_table)
        story.append(Spacer(1, 15))

        # Device details
        story.append(
            Paragraph(
                "<b>DEVICE DETAILS</b>",
                normal_style
            )
        )

        story.append(Spacer(1, 5))

        device_data = [
            [
                Paragraph("<b>Brand</b>", normal_style),
                Paragraph(device.brand, normal_style),
            ],
            [
                Paragraph("<b>Model</b>", normal_style),
                Paragraph(device.model, normal_style),
            ],
            [
                Paragraph("<b>IMEI</b>", normal_style),
                Paragraph(device.imei, normal_style),
            ],
        ]

        device_table = Table(
            device_data,
            colWidths=[55 * mm, 105 * mm]
        )

        device_table.setStyle(
            TableStyle(
                [
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'BACKGROUND',
                        (0, 0),
                        (0, -1),
                        colors.lightgrey
                    ),
                    (
                        'VALIGN',
                        (0, 0),
                        (-1, -1),
                        'MIDDLE'
                    ),
                    (
                        'LEFTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'RIGHTPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'TOPPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'BOTTOMPADDING',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                ]
            )
        )

        story.append(device_table)
        story.append(Spacer(1, 20))

        # Payment amount
        amount_data = [
            [
                Paragraph(
                    "<b>AMOUNT PAID</b>",
                    amount_style
                ),
                Paragraph(
                    f"<b>₹ {payment.amount:.2f}</b>",
                    amount_style
                ),
            ]
        ]

        amount_table = Table(
            amount_data,
            colWidths=[80 * mm, 80 * mm]
        )

        amount_table.setStyle(
            TableStyle(
                [
                    (
                        'BOX',
                        (0, 0),
                        (-1, -1),
                        1,
                        colors.black
                    ),
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, -1),
                        colors.lightgrey
                    ),
                    (
                        'ALIGN',
                        (1, 0),
                        (1, 0),
                        'RIGHT'
                    ),
                    (
                        'LEFTPADDING',
                        (0, 0),
                        (-1, -1),
                        10
                    ),
                    (
                        'RIGHTPADDING',
                        (0, 0),
                        (-1, -1),
                        10
                    ),
                    (
                        'TOPPADDING',
                        (0, 0),
                        (-1, -1),
                        12
                    ),
                    (
                        'BOTTOMPADDING',
                        (0, 0),
                        (-1, -1),
                        12
                    ),
                ]
            )
        )

        story.append(amount_table)
        story.append(Spacer(1, 25))

        # Footer
        story.append(
            Paragraph(
                "Thank you for choosing Mobile Repair Centre.",
                subtitle_style
            )
        )

        story.append(
            Paragraph(
                "This is a computer-generated payment receipt.",
                subtitle_style
            )
        )

        # Build PDF
        document.build(story)

        return response

