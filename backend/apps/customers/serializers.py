from rest_framework import serializers

from .models import Customer, Device
from apps.accounts.models import User


class CustomerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer

        fields = [
            'id',
            'user',
            'customer_code',
            'name',
            'mobile',
            'email',
            'address',
            'status',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'customer_code',
            'created_at',
            'updated_at',
        ]

    def validate_user(self, value):

        # Only CUSTOMER role can have a customer profile
        if value.role != 'CUSTOMER':
            raise serializers.ValidationError(
                "Selected user must have CUSTOMER role."
            )

        # Prevent duplicate customer profile
        if Customer.objects.filter(user=value).exists():
            raise serializers.ValidationError(
                "This user already has a customer profile."
            )

        return value

    def create(self, validated_data):

        user = validated_data['user']

        customer = Customer.objects.create(
            user=user,
            customer_code=f"CUST{user.id:05d}",
            name=validated_data['name'],
            mobile=validated_data['mobile'],
            email=validated_data.get('email', user.email),
            address=validated_data.get('address', ''),
            status=Customer.Status.ACTIVE
        )

        return customer


class CustomerProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = [
            'name',
            'mobile',
            'address',
        ]


class DeviceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Device

        fields = [
            'id',
           
            'customer',
            'brand',
            'model',
            'imei',
            'device_condition',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            
        'created_at',
            'updated_at',
        ]

    def validate_imei(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "IMEI must contain only numbers."
            )

        if len(value) != 15:
            raise serializers.ValidationError(
                "IMEI must be exactly 15 digits."
            )

        return value