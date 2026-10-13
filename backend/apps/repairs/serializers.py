
from datetime import date
import uuid

from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

from .models import Technician, JobCard, StatusHistory, Estimate, Warranty


# =========================================================
# Technician Serializer
# =========================================================

class TechnicianSerializer(serializers.ModelSerializer):

    class Meta:
        model = Technician
        fields = [
            'id', 'name', 'mobile', 'email',
            'specialization', 'status',
        ]
        read_only_fields = ['id', 'status']

    def validate_mobile(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "Mobile number must contain exactly 10 digits."
            )
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "Technician name cannot be empty."
            )
        return value

    def validate_specialization(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "Specialization cannot be empty."
            )
        return value


# =========================================================
# Job Card Serializer
# =========================================================

class JobCardSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobCard
        fields = [
            'id',
            'job_card_number',
            'tracking_token',
            'customer',
            'device',
            'technician',
            'reported_problem',
            'diagnosis',
            'status',
            'priority',
            'intake_date',
            'completed_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'job_card_number',
            'tracking_token',
            'status',
            'completed_date',
            'created_at',
            'updated_at',
        ]

    def get_fields(self):
        fields = super().get_fields()
        fields['intake_date'].required = False
        return fields

    def validate(self, attrs):
        customer = attrs.get(
            'customer',
            getattr(self.instance, 'customer', None)
        )
        device = attrs.get(
            'device',
            getattr(self.instance, 'device', None)
        )
        technician = attrs.get(
            'technician',
            getattr(self.instance, 'technician', None)
        )

        if customer and device and device.customer_id != customer.id:
            raise serializers.ValidationError({
                'device': (
                    'Selected device does not belong to '
                    'the selected customer.'
                )
            })

        if technician and technician.status != Technician.Status.ACTIVE:
            raise serializers.ValidationError({
                'technician': 'Selected technician is inactive.'
            })

        if 'reported_problem' in attrs:
            problem = attrs['reported_problem'].strip()
            if not problem:
                raise serializers.ValidationError({
                    'reported_problem': 'Reported problem cannot be empty.'
                })
            attrs['reported_problem'] = problem

        if 'diagnosis' in attrs:
            diagnosis = attrs['diagnosis'].strip()
            if not diagnosis:
                raise serializers.ValidationError({
                    'diagnosis': 'Diagnosis cannot contain only spaces.'
                })
            attrs['diagnosis'] = diagnosis

        # Prevent more than one active Job Card for the same device.
        # Existing Job Card updates are excluded from this check.
        if self.instance is None and device:
            terminal_statuses = [
                JobCard.Status.COMPLETED,
                JobCard.Status.REJECTED,
                JobCard.Status.CANCELLED,
            ]

            active_exists = JobCard.objects.filter(
                device=device
            ).exclude(status__in=terminal_statuses).exists()

            if active_exists:
                raise serializers.ValidationError({
                    'device': (
                        'This device already has an active Job Card. '
                        'Complete or close the existing repair first.'
                    )
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        last_job = JobCard.objects.order_by('-id').first()
        next_number = last_job.id + 1 if last_job else 1

        validated_data.setdefault('intake_date', timezone.now())

        # Recheck within the transaction to reduce duplicate creation risk.
        device = validated_data['device']
        terminal_statuses = [
            JobCard.Status.COMPLETED,
            JobCard.Status.REJECTED,
            JobCard.Status.CANCELLED,
        ]

        if JobCard.objects.filter(
            device=device
        ).exclude(status__in=terminal_statuses).exists():
            raise serializers.ValidationError({
                'device': 'An active Job Card already exists for this device.'
            })

        return JobCard.objects.create(
            job_card_number=f"JC{next_number:05d}",
            tracking_token=uuid.uuid4().hex,
            **validated_data
        )


# =========================================================
# Job Card Status Update Serializer
# =========================================================

class JobCardStatusUpdateSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=JobCard.Status.choices
    )
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )

    def validate_remarks(self, value):
        return value.strip()


# =========================================================
# Status History Serializer
# =========================================================

class StatusHistorySerializer(serializers.ModelSerializer):

    changed_by_name = serializers.CharField(
        source='changed_by.username',
        read_only=True
    )

    class Meta:
        model = StatusHistory
        fields = [
            'id',
            'job_card',
            'status',
            'remarks',
            'changed_by',
            'changed_by_name',
            'changed_at',
        ]
        read_only_fields = [
            'id',
            'changed_by',
            'changed_by_name',
            'changed_at',
        ]


# =========================================================
# Technician Status Serializer
# =========================================================

class TechnicianStatusSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=Technician.Status.choices
    )


# =========================================================
# Estimate Serializer
# =========================================================

class EstimateSerializer(serializers.ModelSerializer):

    job_card_number = serializers.CharField(
        source='job_card.job_card_number',
        read_only=True
    )
    customer_name = serializers.CharField(
        source='job_card.customer.name',
        read_only=True
    )
    device_name = serializers.SerializerMethodField()

    class Meta:
        model = Estimate
        fields = [
            'id',
            'job_card',
            'job_card_number',
            'customer_name',
            'device_name',
            'service_cost',
            'parts_cost',
            'total_amount',
            'approval_status',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'job_card_number',
            'customer_name',
            'device_name',
            'total_amount',
            'approval_status',
            'approved_by',
            'approved_at',
            'created_at',
            'updated_at',
        ]

    def get_device_name(self, obj):
        device = obj.job_card.device
        return f"{device.brand} {device.model}".strip()

    def validate_service_cost(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Service cost cannot be negative."
            )
        return value

    def validate_parts_cost(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Parts cost cannot be negative."
            )
        return value

    def validate_job_card(self, value):
        forbidden_statuses = [
            JobCard.Status.COMPLETED,
            JobCard.Status.CANCELLED,
            JobCard.Status.REJECTED,
        ]

        if value.status in forbidden_statuses:
            raise serializers.ValidationError(
                "Estimate cannot be created for a closed Job Card."
            )

        if self.instance is None and Estimate.objects.filter(
            job_card=value
        ).exists():
            raise serializers.ValidationError(
                "An Estimate already exists for this Job Card."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        service_cost = validated_data.get('service_cost', 0)
        parts_cost = validated_data.get('parts_cost', 0)

        estimate = Estimate.objects.create(
            total_amount=service_cost + parts_cost,
            **validated_data
        )

        job_card = estimate.job_card

        # Creating an estimate does not mean the customer
        # has already been asked to approve it.
        if job_card.status == JobCard.Status.DIAGNOSIS:
            job_card.status = JobCard.Status.ESTIMATE_PREPARED
            job_card.save(update_fields=['status', 'updated_at'])

            request = self.context.get('request')
            StatusHistory.objects.create(
                job_card=job_card,
                status=JobCard.Status.ESTIMATE_PREPARED,
                remarks='Estimate prepared.',
                changed_by=request.user if request else None,
            )

        return estimate

    @transaction.atomic
    def update(self, instance, validated_data):
        # Only pending estimates may be edited.
        if instance.approval_status != Estimate.ApprovalStatus.PENDING:
            raise serializers.ValidationError(
                "An approved or rejected Estimate cannot be edited."
            )

        service_cost = validated_data.get(
            'service_cost', instance.service_cost
        )
        parts_cost = validated_data.get(
            'parts_cost', instance.parts_cost
        )

        instance = super().update(instance, validated_data)
        instance.total_amount = service_cost + parts_cost
        instance.save(update_fields=['total_amount', 'updated_at'])

        return instance


# =========================================================
# Estimate Approval Serializer
# =========================================================

class EstimateApprovalSerializer(serializers.Serializer):

    approval_status = serializers.ChoiceField(
        choices=[
            (Estimate.ApprovalStatus.APPROVED, 'Approved'),
            (Estimate.ApprovalStatus.REJECTED, 'Rejected'),
        ]
    )
    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )

    def validate_remarks(self, value):
        return value.strip()


# =========================================================
# Warranty Serializer
# =========================================================

class WarrantySerializer(serializers.ModelSerializer):

    class Meta:
        model = Warranty
        fields = [
            'id',
            'job_card',
            'warranty_number',
            'start_date',
            'end_date',
            'warranty_terms',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'warranty_number',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )
        end_date = attrs.get(
            'end_date',
            getattr(self.instance, 'end_date', None)
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })

        return attrs

    def validate_job_card(self, value):
        if value.status != JobCard.Status.COMPLETED:
            raise serializers.ValidationError(
                'Warranty can be created only for a completed Job Card.'
            )

        if hasattr(value, 'warranty'):
            raise serializers.ValidationError(
                'Warranty already exists for this Job Card.'
            )

        return value

    def validate_warranty_terms(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                'Warranty terms cannot be empty.'
            )
        return value

    def create(self, validated_data):
        last_warranty = Warranty.objects.order_by('-id').first()
        next_number = last_warranty.id + 1 if last_warranty else 1

        return Warranty.objects.create(
            warranty_number=f"WR{next_number:05d}",
            status=Warranty.Status.ACTIVE,
            **validated_data
        )


# =========================================================
# Warranty Status Serializer
# =========================================================

class WarrantyStatusSerializer(serializers.Serializer):

    status = serializers.ChoiceField(
        choices=Warranty.Status.choices
    )
