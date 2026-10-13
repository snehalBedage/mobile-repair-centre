from django.db import models


class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        UPI = 'UPI', 'UPI'
        CARD = 'CARD', 'Card'
        OTHER = 'OTHER', 'Other'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    id = models.BigAutoField(primary_key=True)

    job_card = models.ForeignKey(
        'repairs.JobCard',
        on_delete=models.PROTECT,
        related_name='payments'
    )

    payment_reference = models.CharField(
    max_length=100,
    unique=True,
    null=True,
    blank=True
)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )

    payment_date = models.DateTimeField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.payment_reference} - {self.amount}"