from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from shop.models import Profile


class Command(BaseCommand):
    help = "Grant admin and delivery panel access to specific users"

    def handle(self, *args, **options):
        admin_emails = [
            "kartik77@gmail.com",
        ]

        for email in admin_emails:
            try:
                user = User.objects.get(email=email)
                user.is_staff = True
                user.is_superuser = True
                user.save()

                profile, _ = Profile.objects.get_or_create(user=user)
                profile.role = "admin"
                profile.save()

                self.stdout.write(self.style.SUCCESS(
                    f"✅ Granted admin access to {email} ({user.username})"
                ))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f"⚠️ User with email {email} not found, skipping."
                ))
