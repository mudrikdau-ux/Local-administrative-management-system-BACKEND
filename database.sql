-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: lams
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_settings`
--

DROP TABLE IF EXISTS `admin_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `language` enum('english','kiswahili') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'english',
  `theme` enum('light','dark') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'light',
  `email_notifications` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_settings_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_settings`
--

LOCK TABLES `admin_settings` WRITE;
/*!40000 ALTER TABLE `admin_settings` DISABLE KEYS */;
INSERT INTO `admin_settings` VALUES (1,1,'english','light',1,'2026-06-22 22:40:10','2026-06-22 22:47:45');
/*!40000 ALTER TABLE `admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward_id` int DEFAULT NULL,
  `position_id` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `user_id` (`user_id`),
  KEY `ward_id` (`ward_id`),
  KEY `position_id` (`position_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admins_ibfk_2` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admins_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,2,'/uploads/profiles/profile_1782167621931_895782095.jpeg','Juma Hamad Mwinyi','mudydau@icloud.com','0777487848',1,1,'2026-06-18','2029-06-18','active',1,'2026-06-18 10:55:58','2026-06-27 00:06:19');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_views`
--

DROP TABLE IF EXISTS `announcement_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_announce_views` (`announcement_id`),
  CONSTRAINT `announcement_views_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_views`
--

LOCK TABLES `announcement_views` WRITE;
/*!40000 ALTER TABLE `announcement_views` DISABLE KEYS */;
INSERT INTO `announcement_views` VALUES (1,10,'::1','2026-06-27 22:20:40');
/*!40000 ALTER TABLE `announcement_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('meeting','health','emergency','development','education','security','environment','sports','general','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('published','unpublished') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpublished',
  `ward_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `view_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_announcements_ward` (`ward_id`,`is_deleted`),
  KEY `idx_announcements_status` (`status`),
  KEY `idx_announcements_category` (`category`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,'Community Vaccination Drive','health','Free vaccination for all residents at the ward health center this Friday from 8AM to 4 PM.',NULL,'unpublished',3,NULL,NULL,0,'2026-06-22 17:43:31','2026-06-22 20:02:48',0),(2,'Road Construction Notice','development','The main road from Fuoni to Mpendae will be under construction starting next week. Please use alternative routes.',NULL,'published',3,NULL,'2026-06-22 17:43:31',0,'2026-06-22 17:43:31','2026-06-22 19:58:49',0),(3,'Monthly Ward Meeting','meeting','The monthly ward development meeting will be held at the ward office on Friday, June 28, 2026 at 10:00 AM.',NULL,'published',3,NULL,'2026-06-22 17:43:31',0,'2026-06-22 17:43:31','2026-06-22 19:58:49',0),(4,'Security Alert','security','Please be vigilant and report any suspicious activities to the ward security committee. Emergency contacts are available at the ward office.',NULL,'published',3,NULL,'2026-06-22 17:43:31',0,'2026-06-22 17:43:31','2026-06-22 19:58:49',0),(5,'Environmental Cleanup','environment','Community cleanup exercise scheduled for the last Saturday of this month. All residents are requested to participate.',NULL,'published',3,NULL,'2026-06-22 20:02:27',0,'2026-06-22 17:43:31','2026-06-22 20:02:27',0),(6,'Youth Sports Tournament','sports','Annual inter-ward youth football tournament registration now open. Contact the ward sports officer for details.',NULL,'published',3,NULL,'2026-06-22 17:43:31',0,'2026-06-22 17:43:31','2026-06-22 19:58:49',0),(7,'School Registration Notice','education','Primary school registration for the new academic year is now open. Visit the ward education office for assistance.',NULL,'published',3,NULL,'2026-06-22 17:43:31',0,'2026-06-22 17:43:31','2026-06-22 19:58:49',0),(8,'Emergency Water Supply','emergency','Due to pipeline maintenance, water supply will be interrupted on Wednesday. Alternative water points will be available at the ward office.',NULL,'unpublished',3,NULL,NULL,1,'2026-06-22 17:43:31','2026-06-22 20:03:25',0),(9,'Community Vaccination Drive','health','Free vaccination for all residents at the ward health center this Friday from 9 AM to 4 PM.','/uploads/announcements/announcement_1782155588898_93717626.jpeg','unpublished',3,1,NULL,0,'2026-06-22 19:13:09','2026-06-22 19:13:09',0),(10,'Fuoni Community Meeting Notice','meeting','Monthly community meeting scheduled for this Saturday at the Fuoni ward office. All residents are encouraged to attend.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 22:20:41',1),(11,'Free Health Checkup - Fuoni','health','Free health checkup this weekend at the Fuoni local clinic. Services include blood pressure, diabetes screening, and general consultation.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 18:12:43',0),(12,'Public Safety Alert - Fuoni','emergency','Please report any suspicious activities to the Fuoni ward security office. Emergency hotline: 255-XXX-XXX.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 18:12:43',0),(13,'Road Maintenance Notice','development','Road maintenance work on Fuoni Main Road starts next Monday. Please use alternative routes during construction hours.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 18:12:43',0),(14,'Youth Sports Registration','sports','Fuoni youth football tournament registration now open. Register at the ward office before Friday.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 18:12:43',0),(15,'School Supplies Distribution','education','Free school supplies for primary students at Fuoni Ward Office this Thursday from 9 AM to 2 PM.',NULL,'published',1,NULL,'2026-06-27 18:12:43',0,'2026-06-27 18:12:43','2026-06-27 18:12:43',0);
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('success','warning','error') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,NULL,NULL,'ADMIN_CREATED',NULL,'success','admin',1,'Admin Juma Hamad created with temporary password',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 10:55:58'),(2,1,NULL,NULL,'ADMIN_UPDATED',NULL,'success','admin',1,'Admin Juma Hamad updated','{\"id\": 1, \"email\": \"mudy@icloud.com\", \"phone\": \"0759101113\", \"status\": \"active\", \"user_id\": 2, \"ward_id\": 1, \"end_date\": \"2029-06-17T21:00:00.000Z\", \"full_name\": \"Juma Hamad\", \"ward_name\": \"Fuoni\", \"created_at\": \"2026-06-18T10:55:58.000Z\", \"created_by\": 1, \"start_date\": \"2026-06-17T21:00:00.000Z\", \"updated_at\": \"2026-06-18T10:55:58.000Z\", \"position_id\": 1, \"position_name\": \"Ward Administrator\", \"profile_photo\": \"/uploads/profiles/1781780157923-536834461.jpeg\", \"account_status\": \"active\"}','{\"email\": \"mudydau@icloud.com\", \"phone\": \"0759101113\", \"status\": \"active\", \"ward_id\": \"1\", \"end_date\": \"2029-06-18\", \"full_name\": \"Mudy Dau\", \"start_date\": \"2026-06-18\", \"position_id\": \"1\"}',1,'::1',NULL,NULL,NULL,'2026-06-18 11:01:13'),(3,1,NULL,NULL,'ADMIN_SUSPENDED',NULL,'success','admin',1,'Admin Mudy Dau has been suspended',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 11:02:34'),(4,1,NULL,NULL,'ADMIN_ACTIVATED',NULL,'success','admin',1,'Admin Mudy Dau has been activated',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 11:03:00'),(5,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Mudy Dau',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 11:03:29'),(6,1,NULL,NULL,'LEADER_TRANSFERRED',NULL,'success','leadership',1,'Mudy Dau transferred to new ward',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 11:08:52'),(7,1,NULL,NULL,'TERM_EXTENDED',NULL,'success','admin',1,'Term extended for Mudy Dau to 2030-12-31',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-18 11:10:44'),(8,NULL,NULL,NULL,'CITIZEN_SEARCH',NULL,'success','citizen',NULL,'Citizen search performed with query: \"fatma\"',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-19 08:30:28'),(9,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Super Admin logged in successfully',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(10,NULL,'admin@lams.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully',NULL,NULL,NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10','2026-06-20 15:31:13'),(11,NULL,'citizen@email.com','citizen','LOGIN_FAILED','authentication','error',NULL,NULL,'Invalid password attempt',NULL,NULL,NULL,'192.168.1.3','Safari 17','Mobile','iOS 17','2026-06-20 15:31:13'),(12,NULL,'mudrikdau@gmail.com','super_admin','ADMIN_CREATED','admin','success',NULL,NULL,'Created new admin: Juma Hamad',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(13,NULL,'mudrikdau@gmail.com','super_admin','ADMIN_SUSPENDED','admin','warning',NULL,NULL,'Admin Ibrahim Hassan suspended',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(14,NULL,'mudrikdau@gmail.com','super_admin','REPORT_GENERATED','report','success',NULL,NULL,'Citizen Report generated (16 records)',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(15,NULL,'mudrikdau@gmail.com','super_admin','REPORT_GENERATED','report','success',NULL,NULL,'Full System Report generated',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(16,NULL,'mudrikdau@gmail.com','super_admin','REPORT_DOWNLOADED','report','success',NULL,NULL,'Downloaded Full_System_Report.pdf',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(17,NULL,'mudrikdau@gmail.com','super_admin','LEADER_TRANSFERRED','admin','success',NULL,NULL,'Juma Hamad transferred to Chukwani',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(18,NULL,'admin@lams.com','admin','DOCUMENT_UPLOADED','document','success',NULL,NULL,'Uploaded birth certificate for Fatma Ali',NULL,NULL,NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10','2026-06-20 15:31:13'),(19,NULL,'admin@lams.com','admin','PAYMENT_PROCESSED','payment','success',NULL,NULL,'Payment of 5000 TZS received',NULL,NULL,NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10','2026-06-20 15:31:13'),(20,NULL,'citizen@email.com','citizen','PROFILE_UPDATED','citizen','success',NULL,NULL,'Updated phone number',NULL,NULL,NULL,'192.168.1.3','Safari 17','Mobile','iOS 17','2026-06-20 15:31:13'),(21,NULL,'mudrikdau@gmail.com','super_admin','TERM_EXTENDED','admin','success',NULL,NULL,'Term extended for Juma Hamad to 2030-12-31',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(22,NULL,'admin@lams.com','admin','ANNOUNCEMENT_CREATED','announcement','success',NULL,NULL,'Created announcement: Public Holiday',NULL,NULL,NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10','2026-06-20 15:31:13'),(23,NULL,'mudrikdau@gmail.com','super_admin','PASSWORD_RESET','security','warning',NULL,NULL,'Password reset for admin Hassan Mwinyi',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(24,NULL,'system','system','BACKUP_CREATED','system','success',NULL,NULL,'Daily system backup completed',NULL,NULL,NULL,'127.0.0.1','System','Server','Linux','2026-06-20 15:31:13'),(25,NULL,'citizen@email.com','citizen','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Citizen logged in',NULL,NULL,NULL,'192.168.1.4','Chrome 120','Mobile','Android 14','2026-06-20 15:31:13'),(26,NULL,'mudrikdau@gmail.com','super_admin','AUDIT_LOG_VIEWED','system','success',NULL,NULL,'Viewed audit log details #5',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(27,NULL,'admin@lams.com','admin','MESSAGE_SENT','message','success',NULL,NULL,'Sent reply to citizen inquiry',NULL,NULL,NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10','2026-06-20 15:31:13'),(28,NULL,'mudrikdau@gmail.com','super_admin','SYSTEM_SETTING_UPDATED','system','success',NULL,NULL,'Updated email configuration',NULL,NULL,NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11','2026-06-20 15:31:13'),(29,NULL,'superadmin@lams.com','super_admin','SETTINGS_UPDATED','system','success',NULL,NULL,'System settings updated: System Name updated, Organization updated, Contact Email updated, Contact Phone updated','{\"id\": 1, \"logo\": null, \"created_at\": \"2026-06-20T16:30:48.000Z\", \"updated_at\": \"2026-06-20T16:30:48.000Z\", \"updated_by\": null, \"description\": \"Local Administration Management System - A comprehensive platform for managing local government operations, citizens, administrators, documents, and system activities.\", \"system_name\": \"LAMS\", \"website_url\": \"https://mudrikdau-ux.github.io/Local-administrative-management-system/\", \"contact_email\": \"info@lams.go.tz\", \"contact_phone\": \"+255 123 456 789\", \"default_theme\": \"light\", \"system_address\": \"Zanzibar, Tanzania\", \"default_language\": \"english\", \"organization_name\": \"Local Administration\", \"notifications_enabled\": 1, \"email_notifications_enabled\": 1, \"announcement_notifications_enabled\": 1}','{\"system_name\": \"LAMS v2.0\", \"contact_email\": \"admin@lams.go.tz\", \"contact_phone\": \"+255 777 888 999\", \"organization_name\": \"Local Government Administration\"}',1,'::1',NULL,NULL,NULL,'2026-06-20 16:41:15'),(30,NULL,'superadmin@lams.com','super_admin','THEME_CHANGED','system','success',NULL,NULL,'Theme changed from light to light',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 16:42:07'),(31,NULL,'superadmin@lams.com','super_admin','LANGUAGE_CHANGED','system','success',NULL,NULL,'Language changed from english to kiswahili',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 16:42:48'),(32,NULL,'superadmin@lams.com','super_admin','NOTIFICATIONS_UPDATED','system','success',NULL,NULL,'Notification settings updated: System Notifications: ON, Email Notifications: ON, Announcement Notifications: ON',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 16:43:25'),(33,NULL,'mudrikdau@gmail.com','super_admin','SETTINGS_UPDATED','system','success',NULL,NULL,'System settings updated: System Name updated, Organization updated, Contact Email updated, Contact Phone updated, Logo updated','{\"id\": 1, \"logo\": null, \"created_at\": \"2026-06-20T16:30:48.000Z\", \"updated_at\": \"2026-06-20T16:42:48.000Z\", \"updated_by\": 1, \"description\": \"Updated LAMS for better local governance\", \"system_name\": \"LAMS v2.0\", \"website_url\": \"https://www.lams-admin.go.tz\", \"contact_email\": \"admin@lams.go.tz\", \"contact_phone\": \"+255 777 888 999\", \"default_theme\": \"light\", \"system_address\": \"Plot 50, Zanzibar, Tanzania\", \"default_language\": \"kiswahili\", \"organization_name\": \"Local Government Administration\", \"notifications_enabled\": 1, \"email_notifications_enabled\": 1, \"announcement_notifications_enabled\": 1}','{\"system_name\": \"LAMS\", \"contact_email\": \"info@lams.go.tz\", \"contact_phone\": \"+255 123 456 789\", \"organization_name\": \"Local Administration\"}',1,'::1',NULL,NULL,NULL,'2026-06-20 16:51:19'),(34,NULL,'Super Admin','super_admin','ACCOUNT_LOCKED','security','success',NULL,NULL,'Account locked: mudydau@icloud.com (admin)',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 18:41:04'),(35,NULL,'Super Admin','super_admin','ACCOUNT_UNLOCKED','security','success',NULL,NULL,'Account unlocked: mudydau@icloud.com (admin)',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 18:41:38'),(36,NULL,'mudrikdau@gmail.com','super_admin','PROFILE_UPDATED','citizen','success',NULL,NULL,'Profile updated. Changes: Name: \"Super Admin\" → \"Mudrik Mohamed Dau\"','{\"email\": \"mudrikdau@gmail.com\", \"phone\": \"0621662883\", \"full_name\": \"Super Admin\"}','{\"email\": \"mudrikdau@gmail.com\", \"phone\": \"0621662883\", \"full_name\": \"Mudrik Mohamed Dau\"}',1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 19:39:11'),(37,NULL,'mudrikdau@gmail.com','super_admin','PROFILE_IMAGE_CHANGED','citizen','success',NULL,NULL,'Profile photo updated',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 19:42:12'),(38,NULL,'mudrikdau@gmail.com','super_admin','PASSWORD_CHANGED','security','success',NULL,NULL,'Super Admin changed their password',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 19:44:52'),(39,NULL,'mudrikdau@gmail.com','super_admin','PROFILE_IMAGE_REMOVED','citizen','success',NULL,NULL,'Profile photo removed',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-20 19:46:24'),(40,NULL,'mudrikdau@gmail.com','super_admin','PROFILE_IMAGE_CHANGED','citizen','success',NULL,NULL,'Profile photo updated',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 19:47:02'),(41,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:19:07'),(42,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:29:10'),(43,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:39:42'),(44,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:52:48'),(45,NULL,'super_admin@lams.com','super_admin','LOGOUT','authentication','success',NULL,NULL,'super_admin logged out successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:54:26'),(46,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 20:58:17'),(47,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:02:41'),(48,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:06:10'),(49,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:08:43'),(50,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:12:55'),(51,NULL,'super_admin@lams.com','super_admin','LOGOUT','authentication','success',NULL,NULL,'super_admin logged out successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:14:56'),(52,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 21:36:42'),(53,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-20 22:29:57'),(54,NULL,'mudydau@icloud.com','admin','LOGIN_FAILED','authentication','error',NULL,NULL,'Failed login attempt for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:21:41'),(55,NULL,'mudydau@icloud.com','admin','LOGIN_FAILED','authentication','error',NULL,NULL,'Failed login attempt for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:21:54'),(56,NULL,'mudydau@icloud.com','admin','LOGIN_FAILED','authentication','error',NULL,NULL,'Failed login attempt for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:22:09'),(57,NULL,'mudydau@icloud.com','admin','LOGIN_FAILED','authentication','error',NULL,NULL,'Failed login attempt for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:22:15'),(58,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:23:29'),(59,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:25:26'),(60,NULL,'mudydau@icloud.com','admin','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:28:51'),(61,NULL,'mudydau@icloud.com','admin','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:36:20'),(62,NULL,'mudydau@icloud.com','admin','PASSWORD_RESET','authentication','success',NULL,NULL,'Password reset completed for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:37:08'),(63,NULL,'mudydau@icloud.com','admin','LOGOUT','authentication','success',NULL,NULL,'Admin logged out: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:38:57'),(64,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:40:04'),(65,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 20:41:07'),(66,NULL,'mudydau@icloud.com','admin','CITIZEN_CREATED','citizen','success','citizen',17,'Citizen registered: Mariam Juma Ali',NULL,'{\"email\": \"suadothman56@email.com\", \"phone\": \"0759101113\", \"status\": \"active\", \"address\": \"Plot 25, Fuoni Area\", \"full_name\": \"Mariam Juma Ali\"}',2,'::1',NULL,NULL,NULL,'2026-06-21 21:20:02'),(67,NULL,'mudydau@icloud.com','admin','CITIZEN_VIEWED','citizen','success','citizen',17,'Citizen viewed: Mariam Juma Ali',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 21:39:21'),(68,NULL,'mudydau@icloud.com','admin','CITIZEN_VIEWED','citizen','success','citizen',5,'Citizen viewed: Amina Bakari Hamad',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 21:40:43'),(69,NULL,'mudydau@icloud.com','admin','CITIZEN_VIEWED','citizen','success','citizen',6,'Citizen viewed: Yusuf Salim Abdallah',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 21:40:55'),(70,NULL,'mudydau@icloud.com','admin','CITIZEN_UPDATED','citizen','success','citizen',5,'Citizen updated: Mariam Juma Ali Mwinyi','{\"id\": 5, \"email\": \"amina.bakari@email.com\", \"phone\": \"255711100005\", \"gender\": \"female\", \"status\": \"active\", \"address\": \"Plot 30, Chukwani\", \"user_id\": null, \"ward_id\": 3, \"full_name\": \"Amina Bakari Hamad\", \"created_at\": \"2026-06-19T07:52:13.000Z\", \"created_by\": null, \"deleted_at\": null, \"is_deleted\": 0, \"updated_at\": \"2026-06-19T07:52:13.000Z\", \"updated_by\": null, \"citizen_photo\": null, \"date_of_birth\": \"1995-07-18T21:00:00.000Z\", \"registration_date\": \"2024-02-29T21:00:00.000Z\"}','{\"email\": \"suadothman56@gmail.com\", \"phone\": \"0759101114\", \"status\": \"active\", \"address\": \"Plot 30, Fuoni New Area\", \"full_name\": \"Mariam Juma Ali Mwinyi\"}',2,'::1',NULL,NULL,NULL,'2026-06-21 21:48:40'),(71,NULL,'mudydau@icloud.com','admin','CITIZEN_DELETED','citizen','success','citizen',6,'Citizen deleted: Yusuf Salim Abdallah','{\"id\": 6, \"email\": \"yusuf.salim@email.com\", \"phone\": \"255711100006\", \"gender\": \"male\", \"status\": \"active\", \"address\": \"House 77, Chukwani Road\", \"user_id\": null, \"ward_id\": 3, \"full_name\": \"Yusuf Salim Abdallah\", \"created_at\": \"2026-06-19T07:52:13.000Z\", \"created_by\": null, \"deleted_at\": null, \"is_deleted\": 0, \"updated_at\": \"2026-06-19T07:52:13.000Z\", \"updated_by\": null, \"citizen_photo\": null, \"date_of_birth\": \"1982-12-24T21:00:00.000Z\", \"registration_date\": \"2023-11-11T21:00:00.000Z\"}',NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 21:50:50'),(72,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 23:13:39'),(73,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-21 23:14:42'),(74,NULL,'mudydau@icloud.com','admin','DOCUMENT_VIEWED','document','success','document_request',1,'Document request #1 viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 23:32:42'),(75,NULL,'mudydau@icloud.com','admin','DOCUMENT_UPLOADED','document','success','document_request',1,'Document uploaded for request #1 (Birth Certificate - Fatma Ali Juma)',NULL,'{\"file_path\": \"/uploads/documents/doc_1782084981588_267701974.jpeg\", \"file_type\": \"image/jpeg\"}',2,'::1',NULL,NULL,NULL,'2026-06-21 23:36:21'),(76,NULL,'mudydau@icloud.com','admin','DOCUMENT_SENT','document','success','document_request',1,'Document sent to citizen: Fatma Ali Juma (Birth Certificate)',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-21 23:37:33'),(77,NULL,'mudydau@icloud.com','admin','PAYMENTS_SEARCHED','payment','success',NULL,NULL,'Payments searched/filtered',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 01:30:07'),(78,NULL,'mudydau@icloud.com','admin','PAYMENTS_SEARCHED','payment','success',NULL,NULL,'Payments searched/filtered',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 01:30:21'),(79,NULL,'mudydau@icloud.com','admin','PAYMENTS_SEARCHED','payment','success',NULL,NULL,'Payments searched/filtered',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 01:31:19'),(80,NULL,'mudydau@icloud.com','admin','PAYMENT_VIEWED','payment','success','payment',1,'Payment viewed: PAY-2026-0001',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 01:31:46'),(81,NULL,'mudydau@icloud.com','admin','PAYMENT_CREATED','payment','success','payment',9,'Payment created: PAY-2026-0009 - TZS 5000',NULL,'{\"amount\": 5000, \"payment_id\": \"PAY-2026-0009\", \"payment_method\": \"mpesa\", \"payment_status\": \"paid\"}',2,'::1',NULL,NULL,NULL,'2026-06-22 01:32:46'),(82,NULL,'mudydau@icloud.com','admin','PAYMENT_UPDATED','payment','success','payment',1,'Payment status updated: PAY-2026-0001 to paid',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 01:33:19'),(83,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 17:55:17'),(84,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 17:56:17'),(85,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 17:59:24'),(86,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:04:42'),(87,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:13:37'),(88,NULL,'mudydau@icloud.com','admin','OTP_FAILED','authentication','error',NULL,NULL,'Invalid OTP attempt for admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:14:53'),(89,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:15:39'),(90,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:16:14'),(91,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:46:04'),(92,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:46:43'),(93,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:52:23'),(94,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 18:53:10'),(95,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 19:04:31'),(96,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 19:05:07'),(97,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 19:08:37'),(98,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-22 19:09:23'),(99,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_CREATED','announcement','success','announcement',9,'Announcement created: \"Community Vaccination Drive\" (health)',NULL,'{\"title\": \"Community Vaccination Drive\", \"category\": \"health\", \"description\": \"Free vaccination for all residents at the ward health center this Friday from 9 AM to 4 PM.\"}',2,'::1',NULL,NULL,NULL,'2026-06-22 19:13:09'),(100,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_VIEWED','announcement','success','announcement',1,'Announcement viewed: \"Community Health Campaign\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 19:59:58'),(101,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_UPDATED','announcement','success','announcement',1,'Announcement updated: \"Community Vaccination Drive\"','{\"id\": 1, \"image\": null, \"title\": \"Community Health Campaign\", \"status\": \"published\", \"ward_id\": 3, \"category\": \"health\", \"created_at\": \"2026-06-22T17:43:31.000Z\", \"created_by\": null, \"is_deleted\": 0, \"updated_at\": \"2026-06-22T19:58:49.000Z\", \"description\": \"Free health checkup for all residents at the ward office this Saturday from 8 AM to 2 PM. All citizens are encouraged to attend.\", \"published_at\": \"2026-06-22T17:43:31.000Z\"}','{\"title\": \"Community Vaccination Drive\", \"category\": \"health\", \"description\": \"Free vaccination for all residents at the ward health center this Friday from 8AM to 4 PM.\"}',2,'::1',NULL,NULL,NULL,'2026-06-22 20:01:51'),(102,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_PUBLISHED','announcement','success','announcement',5,'Announcement published: \"Environmental Cleanup\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 20:02:27'),(103,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_UNPUBLISHED','announcement','success','announcement',1,'Announcement unpublished: \"Community Vaccination Drive\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 20:02:48'),(104,NULL,'mudydau@icloud.com','admin','ANNOUNCEMENT_DELETED','announcement','success','announcement',8,'Announcement deleted: \"Emergency Water Supply\"','{\"id\": 8, \"image\": null, \"title\": \"Emergency Water Supply\", \"status\": \"unpublished\", \"ward_id\": 3, \"category\": \"emergency\", \"created_at\": \"2026-06-22T17:43:31.000Z\", \"created_by\": null, \"is_deleted\": 0, \"updated_at\": \"2026-06-22T19:58:49.000Z\", \"description\": \"Due to pipeline maintenance, water supply will be interrupted on Wednesday. Alternative water points will be available at the ward office.\", \"published_at\": null}',NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 20:03:26'),(105,NULL,'mudydau@icloud.com','admin','CONVERSATION_OPENED','message','success','conversation',1,'Conversation opened with Fatma Ali Juma',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 20:36:40'),(106,NULL,'mudydau@icloud.com','admin','MESSAGE_SENT','message','success',NULL,NULL,'Message sent to citizen ID: 1',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 20:37:56'),(107,NULL,'mudydau@icloud.com','admin','REPORT_GENERATED','report','success','report',1,'Citizens Report generated with 2 records',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:17:40'),(108,NULL,'mudydau@icloud.com','admin','REPORT_GENERATED','report','success','report',2,'Payments Report generated with 1 records',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:18:39'),(109,NULL,'mudydau@icloud.com','admin','REPORT_GENERATED','report','success','report',3,'Documents Report generated with 1 records',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:19:11'),(110,NULL,'mudydau@icloud.com','admin','REPORT_GENERATED','report','success','report',4,'System Report generated with 3 records',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:19:55'),(111,NULL,'mudydau@icloud.com','admin','REPORT_DOWNLOADED','report','success','report',1,'Report downloaded: Citizens Report',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:20:25'),(112,NULL,'mudydau@icloud.com','admin','REPORT_SHARED','report','success','report',1,'Report shared via email to mudrikdau@gmail.com',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:21:42'),(113,NULL,'mudydau@icloud.com','admin','REPORT_SHARED','report','success','report',1,'Report shared via email to mudrikdau@gmail.com',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 21:26:16'),(114,NULL,'mudydau@icloud.com','admin','PROFILE_VIEWED','citizen','success',NULL,NULL,'Admin viewed their profile',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:27:04'),(115,NULL,'mudydau@gmail.com','admin','PROFILE_UPDATED','citizen','success',NULL,NULL,'Profile updated. Changes: Name updated, Email updated','{\"email\": \"mudydau@icloud.com\", \"phone\": \"0759101113\", \"full_name\": \"Juma Hamad\"}','{\"email\": \"mudydau@gmail.com\", \"phone\": \"0759101113\", \"full_name\": \"Juma Hamad Mwinyi\"}',2,'::1',NULL,NULL,NULL,'2026-06-22 22:29:09'),(116,NULL,'mudydau@icloud.com','admin','PROFILE_PHOTO_UPDATED','citizen','success',NULL,NULL,'Profile photo updated',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:30:30'),(117,NULL,'mudydau@icloud.com','admin','PASSWORD_CHANGE_FAILED','security','error',NULL,NULL,'Failed password change attempt - incorrect current password',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:31:52'),(118,NULL,'mudydau@icloud.com','admin','PASSWORD_CHANGE_FAILED','security','error',NULL,NULL,'Failed password change attempt - incorrect current password',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:32:01'),(119,NULL,'mudydau@icloud.com','admin','PASSWORD_CHANGED','security','success',NULL,NULL,'Admin changed their password',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:32:12'),(120,NULL,'mudydau@icloud.com','admin','PROFILE_PHOTO_REMOVED','citizen','success',NULL,NULL,'Profile photo removed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:32:51'),(121,NULL,'mudydau@icloud.com','admin','PROFILE_PHOTO_UPDATED','citizen','success',NULL,NULL,'Profile photo updated',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:33:41'),(122,NULL,'mudydau@icloud.com','admin','SETTINGS_VIEWED','system','success',NULL,NULL,'Admin viewed their settings',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:44:12'),(123,NULL,'mudydau@icloud.com','admin','SETTINGS_UPDATED','system','success',NULL,NULL,'Settings updated. Changes: Language: english → kiswahili, Theme: light → dark, Email Notifications: 1 → false','{\"id\": 1, \"theme\": \"light\", \"admin_id\": 1, \"language\": \"english\", \"created_at\": \"2026-06-22T22:40:10.000Z\", \"updated_at\": \"2026-06-22T22:40:10.000Z\", \"email_notifications\": 1}','{\"theme\": \"dark\", \"language\": \"kiswahili\", \"email_notifications\": false}',2,'::1',NULL,NULL,NULL,'2026-06-22 22:44:59'),(124,NULL,'mudydau@icloud.com','admin','LANGUAGE_CHANGED','system','success',NULL,NULL,'Language changed from kiswahili to english',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:46:39'),(125,NULL,'mudydau@icloud.com','admin','THEME_CHANGED','system','success',NULL,NULL,'Theme changed from dark to light',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:47:11'),(126,NULL,'mudydau@icloud.com','admin','NOTIFICATIONS_UPDATED','system','success',NULL,NULL,'Email notifications enabled',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-22 22:47:45'),(127,NULL,'mudydau@icloud.com','admin','DASHBOARD_VIEWED','system','success',NULL,NULL,'Admin viewed dashboard overview',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:41:09'),(128,NULL,'mudydau@icloud.com','admin','SEARCH_PERFORMED','system','success',NULL,NULL,'Global search performed: \"fatma\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:44:13'),(129,NULL,'mudydau@icloud.com','admin','SEARCH_PERFORMED','system','success',NULL,NULL,'Global search performed: \"payment\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:44:44'),(130,NULL,'mudydau@icloud.com','admin','SEARCH_PERFORMED','system','success',NULL,NULL,'Global search performed: \"birth\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:45:09'),(131,NULL,'mudydau@icloud.com','admin','SEARCH_PERFORMED','system','success',NULL,NULL,'Global search performed: \"announcement\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:45:35'),(132,NULL,'mudydau@icloud.com','admin','SEARCH_PERFORMED','system','success',NULL,NULL,'Global search performed: \"profile\"',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-23 00:45:55'),(133,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-26 23:24:14'),(134,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Juma Hamad Mwinyi',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-26 23:39:06'),(135,1,NULL,NULL,'ADMIN_UPDATED',NULL,'success','admin',1,'Admin Juma Hamad Mwinyi updated','{\"id\": 1, \"email\": \"mudydau@gmail.com\", \"phone\": \"0759101113\", \"status\": \"active\", \"user_id\": 2, \"ward_id\": 3, \"end_date\": \"2030-12-30T21:00:00.000Z\", \"full_name\": \"Juma Hamad Mwinyi\", \"ward_name\": \"Chukwani\", \"created_at\": \"2026-06-18T10:55:58.000Z\", \"created_by\": 1, \"start_date\": \"2026-06-17T21:00:00.000Z\", \"updated_at\": \"2026-06-22T22:33:41.000Z\", \"position_id\": 2, \"position_name\": \"Executive Officer\", \"profile_photo\": \"/uploads/profiles/profile_1782167621931_895782095.jpeg\", \"account_status\": \"active\"}','{\"email\": \"mudydau@gmail.com\", \"phone\": \"0777487848\", \"status\": \"active\", \"ward_id\": \"1\", \"end_date\": \"2029-06-18\", \"full_name\": \"Juma Hamad Mwinyi\", \"start_date\": \"2026-06-18\", \"position_id\": \"1\"}',1,'::1',NULL,NULL,NULL,'2026-06-26 23:49:50'),(136,NULL,'super_admin@lams.com','super_admin','LOGOUT','authentication','success',NULL,NULL,'super_admin logged out successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-26 23:51:45'),(137,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'super_admin logged in successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-27 00:00:14'),(138,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Juma Hamad Mwinyi',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-27 00:01:52'),(139,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Juma Hamad Mwinyi',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 00:02:03'),(140,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Juma Hamad Mwinyi',NULL,NULL,3,'::1',NULL,NULL,NULL,'2026-06-27 00:02:23'),(141,1,NULL,NULL,'ADMIN_UPDATED',NULL,'success','admin',1,'Admin Juma Hamad Mwinyi updated','{\"id\": 1, \"email\": \"mudydau@gmail.com\", \"phone\": \"0777487848\", \"status\": \"active\", \"user_id\": 2, \"ward_id\": 1, \"end_date\": \"2029-06-17T21:00:00.000Z\", \"full_name\": \"Juma Hamad Mwinyi\", \"ward_name\": \"Fuoni\", \"created_at\": \"2026-06-18T10:55:58.000Z\", \"created_by\": 1, \"start_date\": \"2026-06-17T21:00:00.000Z\", \"updated_at\": \"2026-06-26T23:49:49.000Z\", \"position_id\": 1, \"position_name\": \"Ward Administrator\", \"profile_photo\": \"/uploads/profiles/profile_1782167621931_895782095.jpeg\", \"account_status\": \"active\"}','{\"email\": \"mudydau@icloud.com\", \"phone\": \"0777487848\", \"status\": \"active\", \"ward_id\": \"1\", \"end_date\": \"2029-06-18\", \"full_name\": \"Juma Hamad Mwinyi\", \"start_date\": \"2026-06-18\", \"position_id\": \"1\"}',1,'::1',NULL,NULL,NULL,'2026-06-27 00:06:19'),(142,1,NULL,NULL,'PASSWORD_RESET',NULL,'success','admin',1,'Password reset for Juma Hamad Mwinyi',NULL,NULL,1,'::1',NULL,NULL,NULL,'2026-06-27 00:07:07'),(143,NULL,'super_admin@lams.com','super_admin','LOGOUT','authentication','success',NULL,NULL,'super_admin logged out successfully',NULL,NULL,1,'::1','PostmanRuntime/7.54.0',NULL,NULL,'2026-06-27 00:07:37'),(144,NULL,'mudydau@icloud.com','admin','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to admin: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 00:09:39'),(145,NULL,'mudydau@icloud.com','admin','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Admin logged in successfully: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 00:17:51'),(146,NULL,'mudydau@icloud.com','admin','CITIZEN_UPDATED','citizen','success','citizen',1,'Citizen updated: Fatma Ali Juma','{\"id\": 1, \"email\": \"fatma.ali@email.com\", \"phone\": \"255711100001\", \"gender\": \"female\", \"status\": \"active\", \"address\": \"Plot 12, Fuoni Street\", \"user_id\": null, \"ward_id\": 1, \"full_name\": \"Fatma Ali Juma\", \"created_at\": \"2026-06-19T07:52:13.000Z\", \"created_by\": null, \"deleted_at\": null, \"is_deleted\": 0, \"updated_at\": \"2026-06-19T07:52:13.000Z\", \"updated_by\": null, \"citizen_photo\": null, \"date_of_birth\": \"1990-05-14T21:00:00.000Z\", \"registration_date\": \"2024-01-14T21:00:00.000Z\"}','{\"email\": \"mudydau@icloud.com\", \"phone\": \"255711100001\", \"status\": \"active\", \"address\": \"Plot 12, Fuoni Street\", \"full_name\": \"Fatma Ali Juma\"}',2,'::1',NULL,NULL,NULL,'2026-06-27 00:23:47'),(147,NULL,'mudydau@icloud.com','admin','CITIZEN_PASSWORD_RESET','citizen','success','citizen',1,'Password reset for citizen: Fatma Ali Juma',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 00:39:38'),(148,NULL,'mudydau@icloud.com','citizen','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:07:10'),(149,NULL,'mudydau@icloud.com','citizen','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Citizen logged in: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:08:44'),(150,NULL,'mudydau@icloud.com','citizen','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested by citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:11:39'),(151,NULL,'mudydau@icloud.com','citizen','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested by citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:13:47'),(152,NULL,'mudydau@icloud.com','citizen','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested by citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:31:34'),(153,NULL,'mudydau@icloud.com','citizen','PASSWORD_RESET_REQUESTED','authentication','success',NULL,NULL,'Password reset requested by citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:32:28'),(154,NULL,'mudydau@icloud.com','citizen','PASSWORD_RESET_COMPLETED','authentication','success',NULL,NULL,'Password reset completed for citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:35:55'),(155,NULL,'mudydau@icloud.com','citizen','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:37:14'),(156,NULL,'mudydau@icloud.com','citizen','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Citizen logged in: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 13:38:09'),(157,NULL,'mudydau@icloud.com','citizen','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 15:06:26'),(158,NULL,'mudydau@icloud.com','citizen','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Citizen logged in: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 15:07:36'),(159,NULL,'mudydau@icloud.com','citizen','OTP_SENT','authentication','success',NULL,NULL,'OTP sent to citizen: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 15:16:13'),(160,NULL,'mudydau@icloud.com','citizen','LOGIN_SUCCESS','authentication','success',NULL,NULL,'Citizen logged in: mudydau@icloud.com',NULL,NULL,NULL,'::1',NULL,NULL,NULL,'2026-06-27 15:16:47'),(161,NULL,'mudydau@icloud.com','citizen','APPLICATION_SUBMITTED','document','success','application',2,'Application submitted: Residence Permit',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 15:20:50'),(162,NULL,'mudydau@icloud.com','citizen','PAYMENT_COMPLETED','payment','success','payment',1,'Payment completed: PAY-2026-0001 - TZS 5000.00',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 15:57:40'),(163,NULL,'mudydau@icloud.com','citizen','RECEIPT_DOWNLOADED','payment','success',NULL,NULL,'Receipt downloaded for payment #1',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 15:58:35'),(164,NULL,'mudydau@icloud.com','citizen','APPLICATION_SUBMITTED','document','success','application',3,'Application submitted: Birth Certificate',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 16:18:20'),(165,NULL,'mudydau@icloud.com','citizen','PAYMENT_COMPLETED','payment','success','payment',11,'Payment completed: PAY-2026-0011 - TZS 5000.00',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 16:20:51'),(166,NULL,'mudydau@icloud.com','citizen','RECEIPT_DOWNLOADED','payment','success',NULL,NULL,'Receipt downloaded for payment #11',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 16:21:08'),(167,NULL,'mudydau@icloud.com','citizen','RECEIPT_DOWNLOADED','payment','success',NULL,NULL,'Receipt downloaded for payment #11',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 17:43:18'),(168,NULL,'mudydau@icloud.com','citizen','MESSAGE_SENT','message','success',NULL,NULL,'Message sent in conversation #1',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 17:59:31'),(169,NULL,'mudydau@icloud.com','citizen','ANNOUNCEMENT_VIEWED','announcement','success',NULL,NULL,'Announcement viewed: Fuoni Community Meeting Notice',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 18:15:23'),(170,NULL,'mudydau@icloud.com','citizen','DOCUMENT_DOWNLOADED','document','success',NULL,NULL,'Document downloaded: Birth Certificate',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 18:17:00'),(171,NULL,'mudydau@icloud.com','citizen','DOCUMENT_PRINTED','document','success',NULL,NULL,'Document printed: Birth Certificate',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 18:17:30'),(172,NULL,'mudydau@icloud.com','citizen','DOCUMENT_PRINTED','document','success',NULL,NULL,'Document printed: Birth Certificate',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 18:21:12'),(173,NULL,'mudydau@icloud.com','citizen','DOCUMENT_SHARED','document','success',NULL,NULL,'Document shared with mudrikdau@gmail.com: Birth Certificate',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 18:22:22'),(174,NULL,'mudydau@icloud.com','citizen','PROFILE_VIEWED','citizen','success',NULL,NULL,'Profile viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 20:59:47'),(175,NULL,'mudydau@icloud.com','citizen','PROFILE_VIEWED','citizen','success',NULL,NULL,'Profile viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:02:07'),(176,NULL,'mudydau@icloud.com','citizen','PROFILE_UPDATED','citizen','success',NULL,NULL,'Profile updated',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:03:18'),(177,NULL,'mudydau@icloud.com','citizen','PROFILE_PHOTO_UPDATED','citizen','success',NULL,NULL,'Profile photo updated',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:10:35'),(178,NULL,'mudydau@icloud.com','citizen','PASSWORD_CHANGED','security','success',NULL,NULL,'Password changed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:13:50'),(179,NULL,'mudydau@icloud.com','citizen','PASSWORD_CHANGED','security','success',NULL,NULL,'Password changed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:14:19'),(180,NULL,'mudydau@icloud.com','citizen','FAQ_VIEWED','support','success',NULL,NULL,'FAQs viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:14:41'),(181,NULL,'mudydau@icloud.com','citizen','FAQ_VIEWED','support','success',NULL,NULL,'FAQs viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:14:59'),(182,NULL,'mudydau@icloud.com','citizen','GUIDES_VIEWED','support','success',NULL,NULL,'Guides viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:15:18'),(183,NULL,'mudydau@icloud.com','citizen','SUPPORT_REQUEST','support','success',NULL,NULL,'Support request: Help',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:15:53'),(184,NULL,'mudydau@icloud.com','citizen','ISSUE_REPORTED','support','success',NULL,NULL,'Issue: Bug',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:16:43'),(185,NULL,'mudydau@icloud.com','citizen','DASHBOARD_VIEWED','system','success',NULL,NULL,'Citizen dashboard viewed',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:33:28'),(186,NULL,'mudydau@icloud.com','citizen','NOTIFICATION_READ','system','success',NULL,NULL,'Notification marked as read',NULL,NULL,2,'::1',NULL,NULL,NULL,'2026-06-27 21:36:45');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citizen_applications`
--

DROP TABLE IF EXISTS `citizen_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citizen_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `document_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `additional_notes` text COLLATE utf8mb4_unicode_ci,
  `document_request_id` int DEFAULT NULL,
  `status` enum('pending','processing','approved','rejected','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_citizen_apps` (`citizen_id`,`status`),
  KEY `document_request_id` (`document_request_id`),
  CONSTRAINT `citizen_applications_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `citizen_applications_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `citizen_applications_ibfk_3` FOREIGN KEY (`document_request_id`) REFERENCES `document_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citizen_applications`
--

LOCK TABLES `citizen_applications` WRITE;
/*!40000 ALTER TABLE `citizen_applications` DISABLE KEYS */;
INSERT INTO `citizen_applications` VALUES (1,1,1,'Residence Permit','Needed for bank account opening','Urgent',6,'pending','2026-06-27 15:19:46','2026-06-27 15:19:46'),(2,1,1,'Residence Permit','Needed for bank account opening','Urgent',7,'pending','2026-06-27 15:20:50','2026-06-27 15:20:50'),(3,1,1,'Birth Certificate','Need copy for school registration','Please process quickly',8,'pending','2026-06-27 16:18:20','2026-06-27 16:18:20');
/*!40000 ALTER TABLE `citizen_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citizens`
--

DROP TABLE IF EXISTS `citizens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citizens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `citizen_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `ward_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `profile_photo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','deceased') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) DEFAULT '0',
  `registration_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `national_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `user_id` (`user_id`),
  KEY `idx_citizens_ward` (`ward_id`,`is_deleted`),
  KEY `idx_citizens_name` (`full_name`),
  KEY `idx_citizens_status` (`status`),
  CONSTRAINT `citizens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `citizens_ibfk_2` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citizens`
--

LOCK TABLES `citizens` WRITE;
/*!40000 ALTER TABLE `citizens` DISABLE KEYS */;
INSERT INTO `citizens` VALUES (1,2,'/uploads/profiles/profile_1782594635594_546671723.jpeg','Aisha Mohamed Ali','mudydau@icloud.com','0621662883',NULL,NULL,1,NULL,2,NULL,NULL,NULL,'active',0,'2024-01-15','2026-06-19 07:52:13','2026-06-27 21:10:35',NULL,NULL),(2,NULL,NULL,'Hassan Mwinyi Khamis','hassan.mwinyi@email.com','255711100002','male','1985-08-22',1,NULL,NULL,NULL,'House 45, Fuoni Road',NULL,'active',0,'2024-02-10','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(3,NULL,NULL,'Zainab Omar Said','zainab.omar@email.com','255711100003','female','1992-11-30',2,NULL,NULL,NULL,'Plot 8, Mpendae Area',NULL,'active',0,'2024-01-20','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(4,NULL,NULL,'Abdallah Juma Rashid','abdallah.juma@email.com','255711100004','male','1988-03-14',2,NULL,NULL,NULL,'House 22, Mpendae Lane',NULL,'inactive',0,'2023-06-05','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(5,NULL,NULL,'Mariam Juma Ali Mwinyi','suadothman56@gmail.com','0759101114','female','1995-07-19',3,NULL,2,NULL,'Plot 30, Fuoni New Area',NULL,'active',0,'2024-03-01','2026-06-19 07:52:13','2026-06-21 21:48:40',NULL,NULL),(6,NULL,NULL,'Yusuf Salim Abdallah','yusuf.salim@email.com','255711100006','male','1982-12-25',3,NULL,NULL,'2026-06-21 21:50:50','House 77, Chukwani Road',NULL,'active',1,'2023-11-12','2026-06-19 07:52:13','2026-06-21 21:50:50',NULL,NULL),(7,NULL,NULL,'Rehema Mohamed Ali','rehema.mohamed@email.com','255711100007','female','1991-09-08',4,NULL,NULL,NULL,'Plot 15, Kombeni',NULL,'active',0,'2024-04-18','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(8,NULL,NULL,'Ibrahim Hassan Juma','ibrahim.hassan@email.com','255711100008','male','1987-06-03',4,NULL,NULL,NULL,'House 33, Kombeni Street',NULL,'inactive',0,'2023-08-22','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(9,NULL,NULL,'Mwanamvua Khamis Omar','mwanamvua.khamis@email.com','255711100009','female','1993-01-28',5,NULL,NULL,NULL,'Plot 50, Mwera',NULL,'active',0,'2024-02-28','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(10,NULL,NULL,'Rashid Ali Mohammed','rashid.ali@email.com','255711100010','male','1984-04-17',5,NULL,NULL,NULL,'House 99, Mwera Lane',NULL,'active',0,'2023-10-15','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(11,NULL,NULL,'Hadija Salim Bakari','hadija.salim@email.com','255711100011','female','1996-10-05',6,NULL,NULL,NULL,'Plot 21, Kiembesamaki',NULL,'active',0,'2024-05-10','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(12,NULL,NULL,'Juma Khamis Ali','juma.khamis@email.com','255711100012','male','1981-02-14',6,NULL,NULL,NULL,'House 55, Kiembesamaki Road',NULL,'active',0,'2023-07-30','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(13,NULL,NULL,'Salma Omar Juma','salma.omar@email.com','255711100013','female','1994-08-20',7,NULL,NULL,NULL,'Plot 10, Tomondo',NULL,'active',0,'2024-01-05','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(14,NULL,NULL,'Ali Hassan Mwinyi','ali.hassan@email.com','255711100014','male','1986-11-11',7,NULL,NULL,NULL,'House 44, Tomondo Street',NULL,'inactive',0,'2023-05-18','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(15,NULL,NULL,'Asha Said Khamis','asha.said@email.com','255711100015','female','1997-03-22',8,NULL,NULL,NULL,'Plot 7, Bububu',NULL,'active',0,'2024-06-01','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(16,NULL,NULL,'Mohammed Ali Rashid','mohammed.ali@email.com','255711100016','male','1983-07-09',8,NULL,NULL,NULL,'House 88, Bububu Road',NULL,'active',0,'2023-12-20','2026-06-19 07:52:13','2026-06-19 07:52:13',NULL,NULL),(17,NULL,NULL,'Mariam Juma Ali','suadothman56@email.com','0759101113',NULL,NULL,3,1,NULL,NULL,'Plot 25, Fuoni Area',NULL,'active',0,'2026-06-21','2026-06-21 21:20:01','2026-06-21 21:20:01',NULL,NULL);
/*!40000 ALTER TABLE `citizens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('new','read','replied','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `responded_by` int DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Hami Ngwali','mudydau@gmail.com','+255621662883','General Inquiry','I would like to know more about document application procedures.','new',NULL,NULL,NULL,'::1','2026-06-27 22:22:18','2026-06-27 22:22:18'),(2,'Hami Ngwali','mudydau@icloud.com','+255621662883','General Inquiry','I would like to know more about document application procedures.','new',NULL,NULL,NULL,'::1','2026-06-27 22:22:55','2026-06-27 22:22:55');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `support_id` int DEFAULT NULL,
  `conversation_type` enum('admin','support') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `last_message` text COLLATE utf8mb4_unicode_ci,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`citizen_id`,`admin_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,1,1,NULL,'admin','Hello','2026-06-27 17:59:31','2026-06-22 20:17:42','2026-06-27 17:59:31'),(2,3,1,NULL,'admin','Good morning Admin, when is the next ward meeting?','2026-06-22 20:17:50','2026-06-22 20:17:42','2026-06-22 20:19:18'),(3,5,1,NULL,'admin','Admin, I would like to register for the youth sports tournament.','2026-06-22 20:17:50','2026-06-22 20:17:42','2026-06-22 20:19:18'),(4,7,1,NULL,'admin','Hello, is the water supply issue resolved?','2026-06-22 20:17:50','2026-06-22 20:17:42','2026-06-22 20:19:18'),(5,1,2,NULL,'admin','Hello from test!','2026-06-22 20:46:12','2026-06-22 20:46:12','2026-06-22 20:46:12'),(6,1,NULL,NULL,'support',NULL,NULL,'2026-06-27 17:45:23','2026-06-27 17:45:23');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_activities`
--

DROP TABLE IF EXISTS `dashboard_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `activity` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` enum('application','payment','document','message','profile','system','announcement') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dash_activities` (`citizen_id`,`created_at` DESC),
  CONSTRAINT `dashboard_activities_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_activities`
--

LOCK TABLES `dashboard_activities` WRITE;
/*!40000 ALTER TABLE `dashboard_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_requests`
--

DROP TABLE IF EXISTS `document_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `citizen_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `payment_status` enum('paid','unpaid','exempted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `request_status` enum('pending','processing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `date_requested` date NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_by_admin` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_requests_citizen` (`citizen_id`),
  KEY `idx_doc_requests_status` (`request_status`,`payment_status`),
  CONSTRAINT `document_requests_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_requests`
--

LOCK TABLES `document_requests` WRITE;
/*!40000 ALTER TABLE `document_requests` DISABLE KEYS */;
INSERT INTO `document_requests` VALUES (1,1,'Fatma Ali Juma','Birth Certificate','Need copy for school registration','paid','completed','/uploads/documents/doc_1782084981588_267701974.jpeg','image/jpeg',244281,NULL,'Residential letter','2026-06-15','2026-06-21 23:36:21','2026-06-21 23:37:33',NULL,1,'2026-06-21 23:05:13','2026-06-27 15:57:40'),(2,2,'Hassan Mwinyi Khamis','Residence Permit','For bank account opening','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-18',NULL,NULL,NULL,NULL,'2026-06-21 23:05:13','2026-06-21 23:05:13'),(3,3,'Zainab Omar Said','Marriage Certificate','Required for passport application','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-10',NULL,NULL,NULL,NULL,'2026-06-21 23:05:13','2026-06-27 15:50:11'),(4,5,'Amina Bakari Hamad','Identification Letter','For employment verification','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-20',NULL,NULL,NULL,NULL,'2026-06-21 23:05:13','2026-06-27 15:50:11'),(5,1,'Fatma Ali Juma','Residence Permit','Needed for bank account opening','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-27',NULL,NULL,1,NULL,'2026-06-27 15:18:28','2026-06-27 15:18:28'),(6,1,'Fatma Ali Juma','Residence Permit','Needed for bank account opening','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-27',NULL,NULL,1,NULL,'2026-06-27 15:19:46','2026-06-27 15:19:46'),(7,1,'Fatma Ali Juma','Residence Permit','Needed for bank account opening','unpaid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-27',NULL,NULL,1,NULL,'2026-06-27 15:20:50','2026-06-27 15:42:14'),(8,1,'Fatma Ali Juma','Birth Certificate','Need copy for school registration','paid','pending',NULL,NULL,NULL,NULL,NULL,'2026-06-27',NULL,NULL,1,NULL,'2026-06-27 16:18:20','2026-06-27 16:20:50');
/*!40000 ALTER TABLE `document_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_share_history`
--

DROP TABLE IF EXISTS `document_share_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_share_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `citizen_id` int NOT NULL,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shared_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `idx_doc_shares` (`citizen_id`,`document_id`),
  CONSTRAINT `document_share_history_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `document_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_share_history_ibfk_2` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_share_history`
--

LOCK TABLES `document_share_history` WRITE;
/*!40000 ALTER TABLE `document_share_history` DISABLE KEYS */;
INSERT INTO `document_share_history` VALUES (1,1,1,'mudrikdau@gmail.com','2026-06-27 18:22:22');
/*!40000 ALTER TABLE `document_share_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `fee` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (1,'Birth Certificate','Official birth certificate copy',5000.00,1,'2026-06-21 23:04:55'),(2,'Death Certificate','Official death certificate copy',5000.00,1,'2026-06-21 23:04:55'),(3,'Marriage Certificate','Official marriage certificate copy',10000.00,1,'2026-06-21 23:04:55'),(4,'Residence Permit','Ward residence confirmation letter',3000.00,1,'2026-06-21 23:04:55'),(5,'Identification Letter','Official identification confirmation letter',2000.00,1,'2026-06-21 23:04:55'),(6,'Business Permit','Small business operating permit',15000.00,1,'2026-06-21 23:04:55'),(7,'Land Ownership Letter','Local land ownership confirmation',5000.00,1,'2026-06-21 23:04:55');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_verifications`
--

DROP TABLE IF EXISTS `document_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `verification_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_count` int DEFAULT '0',
  `last_verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_code` (`verification_code`),
  KEY `document_id` (`document_id`),
  KEY `idx_verify_code` (`verification_code`),
  CONSTRAINT `document_verifications_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `document_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_verifications`
--

LOCK TABLES `document_verifications` WRITE;
/*!40000 ALTER TABLE `document_verifications` DISABLE KEYS */;
INSERT INTO `document_verifications` VALUES (1,1,'LAMS-TEST123456789','/uploads/qrcodes/test.png',0,NULL,'2026-06-27 23:08:29');
/*!40000 ALTER TABLE `document_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,'How do I apply for a document?','Log into your Citizen Portal, go to \"My Applications\", click \"New Application\", select the document type, provide the required information, and submit. Your ward administrator will process your request.','documents','active',1,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(2,'How do I pay for services?','After submitting an application, a payment record is automatically created. Go to \"My Payments\", find the unpaid payment, click \"Pay Now\", select your payment method, and complete the transaction.','payments','active',2,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(3,'How do I download my document?','Once your application is approved, payment is completed, and the administrator has uploaded your document, you can download it from \"My Documents\" or from the application details page.','documents','active',3,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(4,'How do I change my password?','Go to \"Profile\", click \"Change Password\", enter your current password, then your new password, confirm it, and click \"Change Password\". For security, use a strong password with at least 6 characters.','account','active',4,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(5,'How long does document processing take?','Processing time varies depending on the document type and workload. Typically, documents are processed within 1-3 business days. You can track your application status in \"My Applications\".','documents','active',5,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(6,'How do I contact my ward administrator?','You can send a message directly through the \"Messages\" section, or submit a support request from \"Help & Support\" → \"Contact Admin\". Your administrator will respond as soon as possible.','support','active',6,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(7,'What payment methods are available?','Currently supported payment methods include M-Pesa, Tigo Pesa, Airtel Money, Bank Transfer, and Cash payments at the ward office.','payments','active',7,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(8,'How do I update my profile information?','Go to \"Profile\", click \"Edit Profile\", update your information, and save changes. For profile photo, use the upload option in the profile section.','account','active',8,'2026-06-27 19:49:33','2026-06-27 19:49:33');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generated_reports`
--

DROP TABLE IF EXISTS `generated_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generated_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` enum('citizens','payments','documents','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `filters_applied` json DEFAULT NULL,
  `record_count` int DEFAULT '0',
  `generated_by` int DEFAULT NULL,
  `generated_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `download_count` int DEFAULT '0',
  `ward_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gen_reports_type` (`report_type`),
  KEY `idx_gen_reports_ward` (`ward_id`),
  KEY `idx_gen_reports_date` (`created_at`),
  CONSTRAINT `generated_reports_ibfk_1` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generated_reports`
--

LOCK TABLES `generated_reports` WRITE;
/*!40000 ALTER TABLE `generated_reports` DISABLE KEYS */;
INSERT INTO `generated_reports` VALUES (1,'Citizens Report','citizens','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\reports\\Citizens_Report_1782163060139.pdf',3003,'{}',2,1,'Admin',1,3,'2026-06-22 21:17:40'),(2,'Payments Report','payments','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\reports\\Payments_Report_1782163119214.pdf',2928,'{}',1,1,'Admin',0,3,'2026-06-22 21:18:39'),(3,'Documents Report','documents','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\reports\\Documents_Report_1782163151824.pdf',2871,'{}',1,1,'Admin',0,3,'2026-06-22 21:19:11'),(4,'System Report','system','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\reports\\System_Report_1782163195352.pdf',3165,'{}',3,1,'Admin',0,3,'2026-06-22 21:19:55');
/*!40000 ALTER TABLE `generated_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leadership_assignments`
--

DROP TABLE IF EXISTS `leadership_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadership_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `ward_id` int NOT NULL,
  `position_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_date` date NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','ended','transferred') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `ward_id` (`ward_id`),
  KEY `position_id` (`position_id`),
  CONSTRAINT `leadership_assignments_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_assignments_ibfk_2` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_assignments_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leadership_assignments`
--

LOCK TABLES `leadership_assignments` WRITE;
/*!40000 ALTER TABLE `leadership_assignments` DISABLE KEYS */;
INSERT INTO `leadership_assignments` VALUES (1,1,1,1,1,'2026-06-18','2026-06-18','2029-06-18','ended','2026-06-18 10:55:58'),(2,1,3,2,1,'2026-07-01','2026-07-01','2030-12-31','active','2026-06-18 11:08:52');
/*!40000 ALTER TABLE `leadership_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leadership_history`
--

DROP TABLE IF EXISTS `leadership_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadership_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `ward_id` int NOT NULL,
  `position_id` int NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `performed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `ward_id` (`ward_id`),
  KEY `position_id` (`position_id`),
  CONSTRAINT `leadership_history_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_history_ibfk_2` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_history_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leadership_history`
--

LOCK TABLES `leadership_history` WRITE;
/*!40000 ALTER TABLE `leadership_history` DISABLE KEYS */;
INSERT INTO `leadership_history` VALUES (1,1,1,1,'appointed','2026-06-18','2029-06-18','Initial appointment',1,'2026-06-18 10:55:58'),(2,1,3,2,'transferred','2026-07-01','2029-06-18','Reassignment for better administration',1,'2026-06-18 11:08:52'),(3,1,3,2,'term_extended','2026-06-18','2030-12-31','Excellent performance and ongoing projects',1,'2026-06-18 11:10:44');
/*!40000 ALTER TABLE `leadership_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leadership_transfers`
--

DROP TABLE IF EXISTS `leadership_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leadership_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `previous_ward_id` int DEFAULT NULL,
  `new_ward_id` int NOT NULL,
  `previous_position_id` int DEFAULT NULL,
  `new_position_id` int NOT NULL,
  `previous_leader_id` int DEFAULT NULL,
  `transfer_date` date NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `transferred_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `previous_ward_id` (`previous_ward_id`),
  KEY `new_ward_id` (`new_ward_id`),
  KEY `previous_position_id` (`previous_position_id`),
  KEY `new_position_id` (`new_position_id`),
  CONSTRAINT `leadership_transfers_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_transfers_ibfk_2` FOREIGN KEY (`previous_ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leadership_transfers_ibfk_3` FOREIGN KEY (`new_ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leadership_transfers_ibfk_4` FOREIGN KEY (`previous_position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leadership_transfers_ibfk_5` FOREIGN KEY (`new_position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leadership_transfers`
--

LOCK TABLES `leadership_transfers` WRITE;
/*!40000 ALTER TABLE `leadership_transfers` DISABLE KEYS */;
INSERT INTO `leadership_transfers` VALUES (1,1,1,3,1,2,NULL,'2026-07-01','Reassignment for better administration',1,'2026-06-18 11:08:52');
/*!40000 ALTER TABLE `leadership_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `sender_role` enum('admin','citizen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_role` enum('admin','citizen','support') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image','file') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `status` enum('sent','delivered','read') COLLATE utf8mb4_unicode_ci DEFAULT 'sent',
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation` (`conversation_id`,`created_at`),
  KEY `idx_messages_sender` (`sender_id`,`sender_role`),
  KEY `idx_messages_receiver` (`receiver_id`,`is_read`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,1,1,'citizen',NULL,'Hello Admin, I need assistance with my birth certificate application.','text','read',1,NULL,'2026-06-22 20:17:50'),(2,1,1,1,'admin',NULL,'Hello Fatma! Sure, I am here to help. What do you need to know?','text','read',1,NULL,'2026-06-22 20:17:50'),(3,1,1,1,'citizen',NULL,'I submitted the application last week but have not received any update.','text','read',1,NULL,'2026-06-22 20:17:50'),(4,1,1,1,'admin',NULL,'Let me check your application status. I will get back to you shortly.','text','read',1,NULL,'2026-06-22 20:17:50'),(5,2,3,1,'citizen',NULL,'Good morning Admin, when is the next ward meeting?','text','read',1,NULL,'2026-06-22 20:17:50'),(6,2,1,3,'admin',NULL,'Good morning Zainab! The next meeting is scheduled for Friday, June 28th at 10 AM.','text','delivered',0,NULL,'2026-06-22 20:17:50'),(7,3,5,1,'citizen',NULL,'Admin, I would like to register for the youth sports tournament.','text','read',1,NULL,'2026-06-22 20:17:50'),(8,3,1,5,'admin',NULL,'Great! Please visit the ward office with your ID to complete registration.','text','delivered',0,NULL,'2026-06-22 20:17:50'),(9,4,7,1,'citizen',NULL,'Hello, is the water supply issue resolved?','text','sent',0,NULL,'2026-06-22 20:17:50'),(10,1,1,1,'admin',NULL,'Hello Fatma! Your document is ready for pickup.','text','read',1,'2026-06-27 17:53:59','2026-06-22 20:37:56'),(11,5,2,1,'admin',NULL,'Hello from test!','text','sent',0,NULL,'2026-06-22 20:46:12'),(12,1,1,1,'citizen','admin','Hello','text','sent',0,NULL,'2026-06-27 17:59:31');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `citizen_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('admin','security','system','report','citizen','document','payment','announcement') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `severity` enum('info','success','warning','error') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `reference_id` int DEFAULT NULL,
  `reference_module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'bell',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  KEY `idx_notifications_created` (`created_at` DESC),
  KEY `citizen_id` (`citizen_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,NULL,'New Admin Created','Admin account created: Juma Hamad Mwinyi','admin','success',1,NULL,'admin_management','user-plus','2026-06-20 21:54:02'),(2,1,NULL,'Admin Password Reset','Password reset requested for admin: Hassan Mwinyi','admin','warning',0,NULL,'admin_management','key','2026-06-20 21:54:02'),(3,1,NULL,'Failed Login Attempt','Multiple failed login attempts detected for citizen@email.com','security','error',0,NULL,'security_center','shield','2026-06-20 21:54:02'),(4,1,NULL,'Account Locked','Account locked: citizen@email.com','security','error',1,NULL,'security_center','lock','2026-06-20 21:54:02'),(5,1,NULL,'System Backup Completed','Daily system backup completed successfully','system','success',1,NULL,'settings','database','2026-06-20 21:54:02'),(6,1,NULL,'Citizen Report Generated','Citizen Report generated with 16 records','report','success',0,NULL,'reports','file-text','2026-06-20 21:54:02'),(7,1,NULL,'Full System Report Downloaded','Full System Report downloaded by Super Admin','report','info',1,NULL,'reports','download','2026-06-20 21:54:02'),(8,1,NULL,'Admin Term Extended','Term extended for Juma Hamad to 2030-12-31','admin','success',1,NULL,'admin_management','clock','2026-06-20 21:54:02'),(9,1,NULL,'New Citizen Registered','New citizen registered: Salma Omar Juma','citizen','info',0,NULL,'citizen_monitoring','user','2026-06-20 21:54:02'),(10,1,NULL,'Audit Report Generated','Audit Log Report generated with 20 records','report','success',0,NULL,'reports','file-text','2026-06-20 21:54:02'),(11,1,NULL,'Security Alert','Suspicious login attempt from unknown IP: 45.33.32.156','security','error',0,NULL,'security_center','alert-triangle','2026-06-20 21:54:02'),(12,1,NULL,'Leadership Transferred','Juma Hamad transferred to Chukwani Ward','admin','info',1,NULL,'admin_management','swap','2026-06-20 21:54:02'),(13,1,NULL,'System Settings Updated','System settings updated by Super Admin','system','info',1,NULL,'settings','settings','2026-06-20 21:54:02'),(14,1,NULL,'Theme Changed','Default theme changed to Dark Mode','system','info',1,NULL,'settings','moon','2026-06-20 21:54:02'),(15,1,NULL,'Profile Updated','Super Admin profile updated successfully','citizen','success',1,NULL,'profile','edit','2026-06-20 21:54:02');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `otp_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_history`
--

DROP TABLE IF EXISTS `payment_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `citizen_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('paid','unpaid','failed','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `transaction_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  KEY `idx_payment_history` (`citizen_id`,`created_at`),
  CONSTRAINT `payment_history_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_history_ibfk_2` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_history`
--

LOCK TABLES `payment_history` WRITE;
/*!40000 ALTER TABLE `payment_history` DISABLE KEYS */;
INSERT INTO `payment_history` VALUES (1,10,1,3000.00,'mpesa','paid','TXN-1782574349516-970ZL5',NULL,'2026-06-27 15:32:29'),(2,1,1,5000.00,'mpesa','paid','TXN-1782575860198-U5M8KO','/uploads/receipts/Receipt_PAY-2026-0001_1782575860315.pdf','2026-06-27 15:57:40'),(3,11,1,5000.00,'mpesa','paid','TXN-1782577250871-FN5W5Y','/uploads/receipts/Receipt_PAY-2026-0011_1782577250975.pdf','2026-06-27 16:20:50');
/*!40000 ALTER TABLE `payment_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `citizen_id` int NOT NULL,
  `document_request_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('mpesa','tigo_pesa','airtel_money','bank_transfer','cash','pending') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('paid','unpaid','pending','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recorded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id` (`payment_id`),
  KEY `idx_payments_status` (`payment_status`),
  KEY `idx_payments_citizen` (`citizen_id`),
  KEY `idx_payments_date` (`payment_date`),
  KEY `idx_payments_doc_request` (`document_request_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`document_request_id`) REFERENCES `document_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'PAY-2026-0001',1,1,5000.00,'mpesa','TXN-1782575860198-U5M8KO','/uploads/receipts/Receipt_PAY-2026-0001_1782575860315.pdf','paid','2026-06-16','Birth certificate fee paid via M-Pesa',NULL,'2026-06-22 00:33:31','2026-06-27 15:57:40'),(2,'PAY-2026-0002',2,2,3000.00,'cash',NULL,NULL,'unpaid','2026-06-18','Residence permit - awaiting payment',NULL,'2026-06-22 00:33:31','2026-06-22 00:33:31'),(3,'PAY-2026-0003',3,3,10000.00,'pending',NULL,NULL,'unpaid','2026-06-12','Marriage certificate fee paid',NULL,'2026-06-22 00:33:31','2026-06-27 15:44:42'),(4,'PAY-2026-0004',5,4,2000.00,'pending',NULL,NULL,'unpaid','2026-06-21','Identification letter fee',NULL,'2026-06-22 00:33:31','2026-06-27 15:44:42'),(5,'PAY-2026-0005',7,NULL,5000.00,'pending',NULL,NULL,'unpaid','2026-06-22','Birth certificate request payment',NULL,'2026-06-22 00:33:31','2026-06-27 15:44:42'),(6,'PAY-2026-0006',9,NULL,3000.00,'airtel_money',NULL,NULL,'pending','2026-06-22','Awaiting payment confirmation',NULL,'2026-06-22 00:33:31','2026-06-22 00:33:31'),(7,'PAY-2026-0007',11,NULL,15000.00,'pending',NULL,NULL,'unpaid','2026-06-20','Business permit fee',NULL,'2026-06-22 00:33:31','2026-06-27 15:44:42'),(8,'PAY-2026-0008',13,NULL,5000.00,'cash',NULL,NULL,'unpaid','2026-06-22','Land ownership letter - unpaid',NULL,'2026-06-22 00:33:31','2026-06-22 00:33:31'),(9,'PAY-2026-0009',1,1,5000.00,'pending',NULL,NULL,'unpaid','2026-06-22','Payment for birth certificate',1,'2026-06-22 01:32:46','2026-06-27 15:44:42'),(10,'PAY-2026-0010',1,7,3000.00,'pending',NULL,NULL,'unpaid','2026-06-27','Residence Permit application fee',1,'2026-06-27 15:20:50','2026-06-27 15:44:42'),(11,'PAY-2026-0011',1,8,5000.00,'mpesa','TXN-1782577250871-FN5W5Y','/uploads/receipts/Receipt_PAY-2026-0011_1782577250975.pdf','paid','2026-06-27','Birth Certificate application fee',1,'2026-06-27 16:18:20','2026-06-27 16:20:51');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `position_name` (`position_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES (1,'Ward Administrator','2026-06-18 09:59:42'),(2,'Executive Officer','2026-06-18 09:59:42'),(3,'Ward Leader','2026-06-18 09:59:42'),(4,'Assistant Administrator','2026-06-18 09:59:42');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reported_issues`
--

DROP TABLE IF EXISTS `reported_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reported_issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `issue_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `citizen_id` (`citizen_id`),
  CONSTRAINT `reported_issues_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reported_issues`
--

LOCK TABLES `reported_issues` WRITE;
/*!40000 ALTER TABLE `reported_issues` DISABLE KEYS */;
INSERT INTO `reported_issues` VALUES (1,1,'Bug','hey-hey','high','open',NULL,NULL,'2026-06-27 21:16:43','2026-06-27 21:16:43');
/*!40000 ALTER TABLE `reported_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_type` enum('citizens','admins','audit','full_system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filters_applied` json DEFAULT NULL,
  `record_count` int DEFAULT '0',
  `generated_by` int DEFAULT NULL,
  `generated_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generated_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('generated','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'generated',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,'citizens','Citizen Report','Complete report of all citizens','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Citizen_Report_1781860034691.pdf','{\"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',16,1,'Super Admin','2026-06-19 09:07:14','generated','2026-06-19 09:07:14'),(2,'citizens','Citizen Report','Complete report of all citizens','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Citizen_Report_1781860069874.pdf','{\"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',16,1,'Super Admin','2026-06-19 09:07:49','generated','2026-06-19 09:07:49'),(3,'citizens','Citizen Report','Complete report of all citizens','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Citizen_Report_1781860101689.pdf','{\"status\": \"active\", \"ward_id\": 1, \"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',2,1,'Super Admin','2026-06-19 09:08:21','generated','2026-06-19 09:08:21'),(4,'admins','Admin Report','Complete report of all administrators','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Admin_Report_1781860507142.pdf','{\"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',1,1,'Super Admin','2026-06-19 09:15:07','generated','2026-06-19 09:15:07'),(5,'audit','Audit Report','System activities and logs','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Audit_Report_1781860547062.pdf','{\"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',8,1,'Super Admin','2026-06-19 09:15:47','generated','2026-06-19 09:15:47'),(6,'full_system','Full System Report','Complete system overview including citizens, admins, audit logs, wards, and statistics','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Full_System_Report_1781860577734.pdf','{}',17,1,'Super Admin','2026-06-19 09:16:17','generated','2026-06-19 09:16:17'),(7,'citizens','Citizen Report','Complete report of all citizens','C:\\Users\\hp\\Desktop\\project lams\\Backend\\uploads\\documents\\Citizen_Report_1781969890587.pdf','{\"generated_by\": 1, \"generated_by_name\": \"Super Admin\"}',16,1,'Super Admin','2026-06-20 15:38:10','generated','2026-06-20 15:38:10');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_alerts`
--

DROP TABLE IF EXISTS `security_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('password_reset','account_locked','account_unlocked','failed_login','suspicious_login','admin_password_change','super_admin_password_change','multiple_failed_attempts') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `performed_by` int DEFAULT NULL,
  `performed_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `security_alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `security_alerts_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
INSERT INTO `security_alerts` VALUES (1,NULL,'admin@lams.com','admin','PASSWORD_RESET','password_reset','Super Admin reset password for admin: Juma Hamad','medium',NULL,'Super Admin','192.168.1.1',0,'2026-06-20 17:34:49'),(2,NULL,'mudrikdau@gmail.com','super_admin','ACCOUNT_LOCKED','account_locked','Super Admin locked account: citizen@email.com','high',NULL,'Super Admin','192.168.1.1',0,'2026-06-20 17:34:49'),(3,NULL,'mudrikdau@gmail.com','super_admin','ACCOUNT_UNLOCKED','account_unlocked','Super Admin unlocked account: citizen@email.com','medium',NULL,'Super Admin','192.168.1.1',0,'2026-06-20 17:34:49'),(4,NULL,'citizen@email.com','citizen','MULTIPLE_FAILED_ATTEMPTS','multiple_failed_attempts','3 failed login attempts detected for citizen@email.com','high',NULL,'System','192.168.1.4',0,'2026-06-20 17:34:49'),(5,NULL,'test@hacker.com',NULL,'SUSPICIOUS_LOGIN','suspicious_login','Suspicious login attempt from unknown IP: 45.33.32.156','critical',NULL,'System','45.33.32.156',0,'2026-06-20 17:34:49'),(6,NULL,'admin@lams.com','admin','PASSWORD_CHANGED','admin_password_change','Admin password changed by Super Admin','medium',NULL,'Super Admin','192.168.1.1',0,'2026-06-20 17:34:49'),(7,NULL,'mudrikdau@gmail.com','super_admin','LOGIN_SUCCESS','super_admin_password_change','Super Admin logged in from new device','low',NULL,'System','192.168.1.1',0,'2026-06-20 17:34:49'),(8,2,'mudydau@icloud.com','admin','ACCOUNT_LOCKED','account_locked','Account locked by Super Admin: mudydau@icloud.com','high',1,'Super Admin','::1',0,'2026-06-20 18:41:04'),(9,2,'mudydau@icloud.com','admin','ACCOUNT_UNLOCKED','account_unlocked','Account unlocked by Super Admin: mudydau@icloud.com','medium',1,'Super Admin','::1',0,'2026-06-20 18:41:38');
/*!40000 ALTER TABLE `security_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_logs`
--

DROP TABLE IF EXISTS `security_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('success','failed','suspicious') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `failure_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `security_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_logs`
--

LOCK TABLES `security_logs` WRITE;
/*!40000 ALTER TABLE `security_logs` DISABLE KEYS */;
INSERT INTO `security_logs` VALUES (1,NULL,'mudrikdau@gmail.com','Super Admin','super_admin','LOGIN','success',NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11',NULL,'2026-06-20 17:34:49'),(2,NULL,'admin@lams.com','Juma Hamad','admin','LOGIN','success',NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10',NULL,'2026-06-20 17:34:49'),(3,NULL,'citizen@email.com','Fatma Ali','citizen','LOGIN','failed','Invalid password','192.168.1.3','Safari 17','Mobile','iOS 17',NULL,'2026-06-20 17:34:49'),(4,NULL,'mudrikdau@gmail.com','Super Admin','super_admin','LOGIN','success',NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11',NULL,'2026-06-20 17:34:49'),(5,NULL,'unknown@test.com',NULL,NULL,'LOGIN','failed','Account not found','10.0.0.55','Chrome 119','Desktop','Linux',NULL,'2026-06-20 17:34:49'),(6,NULL,'admin@lams.com','Juma Hamad','admin','LOGIN','success',NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10',NULL,'2026-06-20 17:34:49'),(7,NULL,'citizen@email.com','Fatma Ali','citizen','LOGIN','failed','Invalid password','192.168.1.4','Chrome Mobile','Mobile','Android 14',NULL,'2026-06-20 17:34:49'),(8,NULL,'mudrikdau@gmail.com','Super Admin','super_admin','LOGIN','success',NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11',NULL,'2026-06-20 17:34:49'),(9,NULL,'test@hacker.com',NULL,NULL,'LOGIN','suspicious','Multiple failed attempts from same IP','45.33.32.156','Python Requests','Server','Unknown',NULL,'2026-06-20 17:34:49'),(10,NULL,'admin@lams.com','Juma Hamad','admin','LOGOUT','success',NULL,'192.168.1.2','Firefox 121','Desktop','Windows 10',NULL,'2026-06-20 17:34:49'),(11,NULL,'mudrikdau@gmail.com','Super Admin','super_admin','LOGIN','success',NULL,'192.168.1.1','Chrome 120','Desktop','Windows 11',NULL,'2026-06-20 17:34:49'),(12,NULL,'citizen@email.com','Fatma Ali','citizen','LOGIN','success',NULL,'192.168.1.3','Safari 17','Mobile','iOS 17',NULL,'2026-06-20 17:34:49'),(13,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:19:07'),(14,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:29:10'),(15,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','failed','Invalid password','::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:36:55'),(16,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:39:42'),(17,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:52:48'),(18,1,'super_admin@lams.com',NULL,'super_admin','LOGOUT','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:54:26'),(19,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 20:58:17'),(20,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:02:41'),(21,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:06:10'),(22,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:08:43'),(23,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:12:55'),(24,1,'super_admin@lams.com',NULL,'super_admin','LOGOUT','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:14:56'),(25,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 21:36:42'),(26,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-20 22:29:57'),(27,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','failed','Invalid password','::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-21 20:21:41'),(28,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','failed','Invalid password','::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-21 20:21:54'),(29,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','failed','Invalid password','::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-21 20:22:09'),(30,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','failed','Invalid password','::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-21 20:22:15'),(31,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-21 20:25:26'),(32,2,'mudydau@icloud.com',NULL,'admin','LOGOUT','success',NULL,'::1',NULL,NULL,NULL,NULL,'2026-06-21 20:38:57'),(33,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-21 20:41:07'),(34,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-21 23:14:42'),(35,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 17:56:17'),(36,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 18:16:14'),(37,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 18:46:43'),(38,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 18:53:10'),(39,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 19:05:07'),(40,2,'mudydau@icloud.com','Juma Hamad','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-22 19:09:23'),(41,2,'mudydau@icloud.com',NULL,'admin','PASSWORD_CHANGED','success',NULL,'::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-22 22:32:11'),(42,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-26 23:24:14'),(43,1,'super_admin@lams.com',NULL,'super_admin','LOGOUT','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-26 23:51:45'),(44,1,'mudrikdau@gmail.com','Mudrik Mohamed Dau','super_admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-27 00:00:14'),(45,1,'super_admin@lams.com',NULL,'super_admin','LOGOUT','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-27 00:07:37'),(46,2,'mudydau@icloud.com','Juma Hamad Mwinyi','admin','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0','Unknown','Unknown',NULL,'2026-06-27 00:17:51'),(47,2,'mudydau@icloud.com','Juma Hamad Mwinyi','citizen','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-27 13:08:44'),(48,2,'mudydau@icloud.com','Juma Hamad Mwinyi','citizen','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-27 13:38:09'),(49,2,'mudydau@icloud.com','Juma Hamad Mwinyi','citizen','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-27 15:07:36'),(50,2,'mudydau@icloud.com','Juma Hamad Mwinyi','citizen','LOGIN','success',NULL,'::1','PostmanRuntime/7.54.0',NULL,NULL,NULL,'2026-06-27 15:16:47');
/*!40000 ALTER TABLE `security_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `citizen_id` (`citizen_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_requests_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_requests`
--

LOCK TABLES `support_requests` WRITE;
/*!40000 ALTER TABLE `support_requests` DISABLE KEYS */;
INSERT INTO `support_requests` VALUES (1,1,1,'Help','I need assistance','open',NULL,NULL,'2026-06-27 21:15:52','2026-06-27 21:15:52');
/*!40000 ALTER TABLE `support_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_backups`
--

DROP TABLE IF EXISTS `system_backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_backups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_size` bigint DEFAULT '0',
  `backup_type` enum('manual','automatic') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `status` enum('completed','failed','in_progress') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `system_backups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_backups`
--

LOCK TABLES `system_backups` WRITE;
/*!40000 ALTER TABLE `system_backups` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_guides`
--

DROP TABLE IF EXISTS `system_guides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_guides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_guides`
--

LOCK TABLES `system_guides` WRITE;
/*!40000 ALTER TABLE `system_guides` DISABLE KEYS */;
INSERT INTO `system_guides` VALUES (1,'How to Apply for Documents','Step-by-step guide on submitting document applications through the citizen portal.',NULL,NULL,'documents','active',1,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(2,'How to Make Payments','Complete guide on payment methods and how to pay for your document applications.',NULL,NULL,'payments','active',2,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(3,'How to Download Documents','Guide on downloading your approved and paid documents from the system.',NULL,NULL,'documents','active',3,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(4,'How to Message Your Administrator','Learn how to communicate with your ward administrator through the messaging system.',NULL,NULL,'communication','active',4,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(5,'Understanding Application Statuses','Explanation of different application statuses and what they mean.',NULL,NULL,'documents','active',5,'2026-06-27 19:49:33','2026-06-27 19:49:33'),(6,'System Security Tips','Best practices for keeping your account secure.',NULL,NULL,'account','active',6,'2026-06-27 19:49:33','2026-06-27 19:49:33');
/*!40000 ALTER TABLE `system_guides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LAMS',
  `organization_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Local Administration',
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info@lams.go.tz',
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '+255 123 456 789',
  `system_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Zanzibar, Tanzania',
  `website_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'https://www.lams.go.tz',
  `default_theme` enum('light','dark') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'light',
  `default_language` enum('english','kiswahili') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'english',
  `notifications_enabled` tinyint(1) DEFAULT '1',
  `email_notifications_enabled` tinyint(1) DEFAULT '1',
  `announcement_notifications_enabled` tinyint(1) DEFAULT '1',
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'LAMS','Local Administration','info@lams.go.tz','+255 123 456 789','Plot 50, Zanzibar, Tanzania','https://www.lams-admin.go.tz','light','kiswahili',1,1,1,'/uploads/profiles/1781974278858-333994731.jpeg','Updated LAMS for better local governance',1,'2026-06-20 16:30:48','2026-06-20 16:51:19');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blacklisted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_token` (`token`(255)),
  CONSTRAINT `token_blacklist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist`
--

LOCK TABLES `token_blacklist` WRITE;
/*!40000 ALTER TABLE `token_blacklist` DISABLE KEYS */;
INSERT INTO `token_blacklist` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzgxOTg2NzQ3LCJleHAiOjE3ODI1OTE1NDd9.NvXgm04F-3vrI5rVeQzQAY1dNvaz3cFZltDdanl9F78',1,'super_admin@lams.com','super_admin','2026-06-20 20:54:26',NULL),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzgxOTg5OTc1LCJleHAiOjE3ODI1OTQ3NzV9.BbMvvqIJ7CoOkCo8xwKS-SfKeU_Yvp4dPbfu5VZRMRc',1,'super_admin@lams.com','super_admin','2026-06-20 21:14:56',NULL),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJtdWR5ZGF1QGljbG91ZC5jb20iLCJyb2xlIjoiYWRtaW4iLCJhZG1pbl9pZCI6MSwid2FyZF9pZCI6Mywid2FyZF9uYW1lIjoiQ2h1a3dhbmkiLCJpYXQiOjE3ODIwNzM1MjYsImV4cCI6MTc4MjEwMjMyNn0.482jettM0F5Zfl9A3X6WxPMGj2X6Hjpy1ZiG2QbUAaE',2,'mudydau@icloud.com','admin','2026-06-21 20:38:57',NULL),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzgyNTE2MjU0LCJleHAiOjE3ODMxMjEwNTR9.6w2maTVO5froEaBS7VV1wwZU04v_ENsHg9iDDqdAfLs',1,'super_admin@lams.com','super_admin','2026-06-26 23:51:45',NULL),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzgyNTE4NDEzLCJleHAiOjE3ODMxMjMyMTN9.eKmefJqS-SLhKUiFWi3MvggI_76KVNdFwqTpl66i0D8',1,'super_admin@lams.com','super_admin','2026-06-27 00:07:37',NULL);
/*!40000 ALTER TABLE `token_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_presence`
--

DROP TABLE IF EXISTS `user_presence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_presence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role` enum('admin','citizen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_online` tinyint(1) DEFAULT '0',
  `last_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `socket_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_presence` (`user_id`,`role`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_presence`
--

LOCK TABLES `user_presence` WRITE;
/*!40000 ALTER TABLE `user_presence` DISABLE KEYS */;
INSERT INTO `user_presence` VALUES (1,1,'citizen',1,'2026-06-22 20:18:19',NULL),(2,3,'citizen',0,'2026-06-22 20:18:19',NULL),(3,5,'citizen',1,'2026-06-22 20:18:19',NULL),(4,7,'citizen',0,'2026-06-22 20:18:19',NULL),(5,2,'admin',0,'2026-06-22 20:47:39','OsYXyQqaylbbOnMHAAAB');
/*!40000 ALTER TABLE `user_presence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('active','expired','logged_out') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `temp_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_changed` tinyint(1) DEFAULT '0',
  `role` enum('super_admin','admin','citizen') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'citizen',
  `status` enum('active','suspended','inactive','locked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `login_attempts` int DEFAULT '0',
  `is_locked` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `otp_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `otp_attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Mudrik Mohamed Dau','mudrikdau@gmail.com','0621662883','/uploads/profiles/profile_1781984822688_896719547.jpeg','$2b$12$NKQQrrQTJf3Jy.Wb.E4GTuyQZgQi3ZPnFwwaB/RQ15BiA1huDeEAq',NULL,0,'super_admin','active',0,0,NULL,NULL,NULL,0,'2026-06-17 19:37:25','2026-06-20 19:47:02',1),(2,'Aisha Mohamed Ali','mudydau@icloud.com','0621662883','/uploads/profiles/profile_1782594635594_546671723.jpeg','$2b$12$nGld1VAswZmgGtOQuFW7.uYjMc.ieYmroT4nIHoxgLMJTA1e1Wpl6',NULL,1,'citizen','active',0,0,'2026-06-27 15:16:47',NULL,NULL,0,'2026-06-18 10:55:58','2026-06-27 21:14:14',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wards`
--

DROP TABLE IF EXISTS `wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ward_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ward_name` (`ward_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wards`
--

LOCK TABLES `wards` WRITE;
/*!40000 ALTER TABLE `wards` DISABLE KEYS */;
INSERT INTO `wards` VALUES (1,'Fuoni','2026-06-18 09:58:58'),(2,'Mpendae','2026-06-18 09:58:58'),(3,'Chukwani','2026-06-18 09:58:58'),(4,'Kombeni','2026-06-18 09:58:58'),(5,'Mwera','2026-06-18 09:58:58'),(6,'Kiembesamaki','2026-06-18 09:58:58'),(7,'Tomondo','2026-06-18 09:58:58'),(8,'Bububu','2026-06-18 09:58:58'),(10,'Magogoni','2026-06-18 10:42:19');
/*!40000 ALTER TABLE `wards` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-28  2:49:43
