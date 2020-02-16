create table announcement
(
	id int auto_increment,
	title varchar(255) not null,
	description text not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
	constraint announcement_pk
		primary key (id)
);
--
create table task
(
	id int auto_increment,
	name varchar(255) not null,
	description text not null,
	category varchar(128) not null,
	difficult varchar(32) not null,
	started_at timestamp default null null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
	constraint task_pk
		primary key (id)
);
--
create table task_flags
(
	id int auto_increment,
	task_id int not null,
	flag varchar(255) not null unique,
	constraint task_flags_pk
		primary key (id),
	constraint task_flags_task_id_fk
		foreign key (task_id) references task (id)
);
--
create table team
(
	id int auto_increment,
	name varchar(255) not null unique,
	email varchar(255) not null unique,
	password varchar(255) not null,
	active boolean default false not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    avatar varchar(64) not null,
    country varchar(4) not null,
    affiliation varchar(64) not null default '',
    website varchar(255) not null default '',
	constraint team_pk
		primary key (id)
);
--
create table team_avatar (
	id int auto_increment,
	team_id int not null unique,
    avatar_path varchar(64) not null,
    avatar MEDIUMBLOB not null,
	constraint team_avatar_pk
		primary key (id),
	constraint team_avatar_team_id_fk
		foreign key (team_id) references team (id)
);
--
create table audit
(
	id int auto_increment,
	team_id int not null,
	task_id int not null,
	created_at timestamp default CURRENT_TIMESTAMP not null,
	constraint audit_pk
		primary key (id),
	constraint audit_team_id_fk
		foreign key (team_id) references team (id),
	constraint audit_task_id_fk
		foreign key (task_id) references task (id)
);
--
create unique index audit_task_id_team_id_uindex
	on audit (task_id, team_id);
--
--
-- django sql
--
CREATE TABLE `django_migrations` (
    `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `app` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `applied` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Create model ContentType
--
CREATE TABLE `django_content_type` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(100) NOT NULL, `app_label` varchar(100) NOT NULL, `model` varchar(100) NOT NULL);
--
-- Alter unique_together for contenttype (1 constraint(s))
--
ALTER TABLE `django_content_type` ADD CONSTRAINT `django_content_type_app_label_model_76bd3d3b_uniq` UNIQUE (`app_label`, `model`);
--
-- Change Meta options on contenttype
--
--
-- Alter field name on contenttype
--
ALTER TABLE `django_content_type` MODIFY `name` varchar(100) NULL;
--
-- MIGRATION NOW PERFORMS OPERATION THAT CANNOT BE WRITTEN AS SQL:
-- Raw Python operation
--
--
-- Remove field name from contenttype
--
ALTER TABLE `django_content_type` DROP COLUMN `name`;
--
--
-- Create model Session
--
CREATE TABLE `django_session` (`session_key` varchar(40) NOT NULL PRIMARY KEY, `session_data` longtext NOT NULL, `expire_date` datetime(6) NOT NULL);
CREATE INDEX `django_session_expire_date_a5c62663` ON `django_session` (`expire_date`);
--
-- Alter field action_time on logentry
--
--
-- Alter field action_flag on logentry
--
--
-- Create model Permission
--
CREATE TABLE `auth_permission` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(50) NOT NULL, `content_type_id` integer NOT NULL, `codename` varchar(100) NOT NULL);
--
-- Create model Group
--
CREATE TABLE `auth_group` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `name` varchar(80) NOT NULL UNIQUE);
CREATE TABLE `auth_group_permissions` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `group_id` integer NOT NULL, `permission_id` integer NOT NULL);
--
-- Create model User
--
CREATE TABLE `auth_user` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `password` varchar(128) NOT NULL, `last_login` datetime(6) NOT NULL, `is_superuser` bool NOT NULL, `username` varchar(30) NOT NULL UNIQUE, `first_name` varchar(30) NOT NULL, `last_name` varchar(30) NOT NULL, `email` varchar(75) NOT NULL, `is_staff` bool NOT NULL, `is_active` bool NOT NULL, `date_joined` datetime(6) NOT NULL);
CREATE TABLE `auth_user_groups` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `user_id` integer NOT NULL, `group_id` integer NOT NULL);
CREATE TABLE `auth_user_user_permissions` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `user_id` integer NOT NULL, `permission_id` integer NOT NULL);
ALTER TABLE `auth_permission` ADD CONSTRAINT `auth_permission_content_type_id_codename_01ab375a_uniq` UNIQUE (`content_type_id`, `codename`);
ALTER TABLE `auth_permission` ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` UNIQUE (`group_id`, `permission_id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);
ALTER TABLE `auth_group_permissions` ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);
ALTER TABLE `auth_user_groups` ADD CONSTRAINT `auth_user_groups_user_id_group_id_94350c0c_uniq` UNIQUE (`user_id`, `group_id`);
ALTER TABLE `auth_user_groups` ADD CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);
ALTER TABLE `auth_user_groups` ADD CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);
ALTER TABLE `auth_user_user_permissions` ADD CONSTRAINT `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` UNIQUE (`user_id`, `permission_id`);
ALTER TABLE `auth_user_user_permissions` ADD CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);
ALTER TABLE `auth_user_user_permissions` ADD CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`);
--
-- Alter field name on permission
--
ALTER TABLE `auth_permission` MODIFY `name` varchar(255) NOT NULL;
--
-- Alter field email on user
--
ALTER TABLE `auth_user` MODIFY `email` varchar(254) NOT NULL;
--
-- Alter field username on user
--
--
-- Alter field last_login on user
--
ALTER TABLE `auth_user` MODIFY `last_login` datetime(6) NULL;
--
-- Alter field username on user
--
--
-- Alter field username on user
--
ALTER TABLE `auth_user` MODIFY `username` varchar(150) NOT NULL;
--
-- Alter field last_name on user
--
ALTER TABLE `auth_user` MODIFY `last_name` varchar(150) NOT NULL;
--
-- Alter field name on group
--
ALTER TABLE `auth_group` MODIFY `name` varchar(150) NOT NULL;
--
--
-- Create model LogEntry
--
CREATE TABLE `django_admin_log` (`id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY, `action_time` datetime(6) NOT NULL, `object_id` longtext NULL, `object_repr` varchar(200) NOT NULL, `action_flag` smallint UNSIGNED NOT NULL CHECK (`action_flag` >= 0), `change_message` longtext NOT NULL, `content_type_id` integer NULL, `user_id` integer NOT NULL);
ALTER TABLE `django_admin_log` ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);
ALTER TABLE `django_admin_log` ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);
--
--
-- django end
--
--
-- some fake data
--
-- insert into task (id, name, description, category, difficult, started_at, created_at) VALUES
-- (1, 'Task 1', 'Opis taska 1, flaga ctf{flag_1}', 'web', 'easy', now(), now()),
-- (2, 'Task 2', 'Opis taska 2, flaga ctf{flag_2}', 'web pwn', 'hard', now(), now()),
-- (3, 'Task 3', 'Opis taska 3, flaga ctf{flag_3}', 'web misc', 'medium', now(), now()),
-- (4, 'Task 4', 'Opis taska 4, flaga ctf{flag_4}', 're', 'medium', now(), now()),
-- (5, 'Task 5', 'Opis taska 5, flaga ctf{flag_5}', 're', 'medium', now(), now()),
-- (6, 'Task 6', 'Opis taska 6, flaga ctf{flag_6}', 're', 'easy', now(), now()),
-- (7, 'Task 7', 'Opis taska 7, flaga ctf{flag_7}', 'misc', 'easy', now(), now()),
-- (8, 'Task 8', 'Opis taska 8, flaga ctf{flag_8}', 'misc', 'easy', now(), now()),
-- (9, 'Task 9', 'Opis taska 9, flaga ctf{flag_9}', 'misc', 'hard', now(), now()),
-- (10, 'Task 10', 'Opis taska 10', 'pwn', 'easy', now(), now()),
-- (11, 'Task 11', 'Opis taska 11', 'pwn', 'hard', now(), now()),
-- (12, 'Task 12', 'Opis taska 12', 'pwn', 'hard', now(), now()),
-- (13, 'Task 13', 'Opis taska 13', 'stegano', 'easy', DATE_ADD(NOW(), INTERVAL 5 MINUTE), now()),
-- (14, 'Task 14', 'Opis taska 14', 'stegano', 'easy', DATE_ADD(NOW(), INTERVAL 10 MINUTE), now()),
-- (15, 'Task 15', 'Opis taska 15', 'stegano', 'easy', DATE_ADD(NOW(), INTERVAL 15 MINUTE), now()),
-- (16, 'Task 16', 'Opis taska 16', 'stegano', 'easy', DATE_ADD(NOW(), INTERVAL 20 MINUTE), now()),
-- (17, 'Task 17', 'Opis taska 17 trzy możliwe flagi: ctf{flag_17_1} ctf{flag_17_2} ctf{flag_17_3}', 'stegano', 'easy', null, now());
--
-- insert into task_flags (id, task_id, flag) values
-- (NULL, 1, 'ctf{flag_1}'),
-- (NULL, 2, 'ctf{flag_2}'),
-- (NULL, 3, 'ctf{flag_3}'),
-- (NULL, 4, 'ctf{flag_4}'),
-- (NULL, 5, 'ctf{flag_5}'),
-- (NULL, 6, 'ctf{flag_6}'),
-- (NULL, 7, 'ctf{flag_7}'),
-- (NULL, 8, 'ctf{flag_8}'),
-- (NULL, 9, 'ctf{flag_9}'),
-- (NULL, 10, 'ctf{flag_10}'),
-- (NULL, 11, 'ctf{flag_11}'),
-- (NULL, 12, 'ctf{flag_12}'),
-- (NULL, 13, 'ctf{flag_13}'),
-- (NULL, 14, 'ctf{flag_14}'),
-- (NULL, 15, 'ctf{flag_15}'),
-- (NULL, 16, 'ctf{flag_16}'),
-- (NULL, 17, 'ctf{flag_17_1}'),
-- (NULL, 17, 'ctf{flag_17_2}'),
-- (NULL, 17, 'ctf{flag_17_3}');
--
-- insert into announcement (id, title, description, created_at) VALUES
-- (NULL, 'title 1', 'description 1', NOW()),
-- (NULL, 'title 2', 'description 2', NOW()),
-- (NULL, 'title 3', 'description 3', NOW()),
-- (NULL, 'title 4', 'description 4', NOW()),
-- (NULL, 'title 5', 'description 5', NOW());
