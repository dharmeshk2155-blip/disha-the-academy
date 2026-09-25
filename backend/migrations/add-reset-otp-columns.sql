-- Run this once against your dbo.Users table (Azure/SSMS/whatever tool
-- you use to manage the SQL Server database) before using forgot-password.

ALTER TABLE dbo.Users
ADD ResetOTP NVARCHAR(10) NULL,
    ResetOTPExpiry DATETIME NULL;
    