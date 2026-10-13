from django.db import models
from django.db.models import Sum, F

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import AuditLog
from .serializers import AuditLogSerializer

from apps.customers.models import Customer, Device
from apps.repairs.models import JobCard
from apps.billing.models import Payment
from apps.inventory.models import SparePart


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'detail': 'Only Admin can view audit logs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        audit_logs = (
            AuditLog.objects
            .select_related('user')
            .order_by('-created_at')
        )

        # Search by user email, action, or table name
        search = request.query_params.get('search', '').strip()
        if search:
            audit_logs = audit_logs.filter(
                models.Q(user__email__icontains=search)
                | models.Q(action__icontains=search)
                | models.Q(table_name__icontains=search)
            )

        # Filter by table name
        table_name = request.query_params.get('table_name', '').strip()
        if table_name:
            audit_logs = audit_logs.filter(
                table_name__iexact=table_name
            )

        # Filter by action
        action = request.query_params.get('action', '').strip()
        if action:
            audit_logs = audit_logs.filter(
                action__icontains=action
            )

        serializer = AuditLogSerializer(
            audit_logs,
            many=True
        )
        return Response(serializer.data)
class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        if request.user.role != 'ADMIN':
            return Response(
        {'detail': 'Only Admin can view reports.'},
        status=status.HTTP_403_FORBIDDEN
    )


        total_customers = Customer.objects.count()
        total_devices = Device.objects.count()
        total_job_cards = JobCard.objects.count()

        completed_repairs = JobCard.objects.filter(
            status=JobCard.Status.COMPLETED
        ).count()

        cancelled_repairs = JobCard.objects.filter(
            status=JobCard.Status.CANCELLED
        ).count()

        pending_repairs = JobCard.objects.exclude(
            status__in=[
                JobCard.Status.COMPLETED,
                JobCard.Status.CANCELLED
            ]
        ).count()

        total_revenue = Payment.objects.filter(
            payment_status=Payment.PaymentStatus.PAID
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        low_stock_parts = SparePart.objects.filter(
            quantity__lte=F('reorder_level'),
            status=SparePart.Status.ACTIVE
        ).count()

        return Response({
            'total_customers': total_customers,
            'total_devices': total_devices,
            'total_job_cards': total_job_cards,
            'completed_repairs': completed_repairs,
            'pending_repairs': pending_repairs,
            'cancelled_repairs': cancelled_repairs,
            'total_revenue': total_revenue,
            'low_stock_parts': low_stock_parts,
        })


class JobCardStatusReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        if request.user.role != 'ADMIN':
             return Response(
        {'detail': 'Only Admin can view reports.'},
        status=status.HTTP_403_FORBIDDEN
    )


        status_report = {}

        for status_value, status_label in JobCard.Status.choices:
            status_report[status_value] = JobCard.objects.filter(
                status=status_value
            ).count()

        return Response(status_report)


class RevenuePaymentReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        if request.user.role != 'ADMIN':
             return Response(
        {'detail': 'Only Admin can view reports.'},
        status=status.HTTP_403_FORBIDDEN
    )


        total_payments = Payment.objects.count()

        total_paid_amount = Payment.objects.filter(
            payment_status=Payment.PaymentStatus.PAID
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        total_pending_amount = Payment.objects.filter(
            payment_status=Payment.PaymentStatus.PENDING
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        total_failed_amount = Payment.objects.filter(
            payment_status=Payment.PaymentStatus.FAILED
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        payment_method_report = {}

        for method_value, method_label in Payment.PaymentMethod.choices:
            amount = Payment.objects.filter(
                payment_method=method_value,
                payment_status=Payment.PaymentStatus.PAID
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0

            payment_method_report[method_value] = amount

        return Response({
            'total_payments': total_payments,
            'total_paid_amount': total_paid_amount,
            'total_pending_amount': total_pending_amount,
            'total_failed_amount': total_failed_amount,
            'payment_method_wise': payment_method_report,
        })


class InventoryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        if request.user.role != 'ADMIN':
            return Response(
        {'detail': 'Only Admin can view reports.'},
        status=status.HTTP_403_FORBIDDEN
    )


        total_parts = SparePart.objects.count()

        total_available_stock = SparePart.objects.aggregate(
            total=Sum('quantity')
        )['total'] or 0

        low_stock_parts = SparePart.objects.filter(
            quantity__lte=F('reorder_level'),
            status=SparePart.Status.ACTIVE
        ).count()

        out_of_stock_parts = SparePart.objects.filter(
            quantity=0,
            status=SparePart.Status.ACTIVE
        ).count()

        return Response({
            'total_parts': total_parts,
            'total_available_stock': total_available_stock,
            'low_stock_parts': low_stock_parts,
            'out_of_stock_parts': out_of_stock_parts,
        })


class RepairPerformanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
       
        if request.user.role != 'ADMIN':
            return Response(
        {'detail': 'Only Admin can view reports.'},
        status=status.HTTP_403_FORBIDDEN
    )


        total_repairs = JobCard.objects.count()

        completed_repairs = JobCard.objects.filter(
            status=JobCard.Status.COMPLETED
        ).count()

        cancelled_repairs = JobCard.objects.filter(
            status=JobCard.Status.CANCELLED
        ).count()

        pending_repairs = JobCard.objects.exclude(
            status__in=[
                JobCard.Status.COMPLETED,
                JobCard.Status.CANCELLED
            ]
        ).count()

        repair_in_progress = JobCard.objects.filter(
            status=JobCard.Status.REPAIR_IN_PROGRESS
        ).count()

        return Response({
            'total_repairs': total_repairs,
            'completed_repairs': completed_repairs,
            'pending_repairs': pending_repairs,
            'repair_in_progress': repair_in_progress,
            'cancelled_repairs': cancelled_repairs,
        })
