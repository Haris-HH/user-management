Please continue working on the following project:

`D:\Projects\new_lpr_center\user_management\user-management`

Create a new page for managing **LPR Center permission groups and group assignments**.

## Page location and navigation

Add the new page under the existing menu group:

**จัดการผู้ใช้งาน**

Add an appropriate submenu item such as:

**จัดการกลุ่มสิทธิ์ LPR Center**

Follow the existing project architecture, routing, folder structure, component patterns, theme, localization, validation, loading states, confirmation dialogs, and API-service conventions.

Do not create an isolated implementation that bypasses the existing shared components or application structure.

---

# Purpose

This page is responsible for:

1. Managing LPR Center permission groups.
2. Configuring permissions for each group.
3. Assigning users to LPR Center groups.
4. Removing users from LPR Center groups.
5. Viewing which users belong to each group.

The page is specifically for permissions used by:

`D:\Projects\lpr-center\lpr-center-web`

---

# Base Groups

The system must support these base groups:

* Investigation Department
* User

Administrators can modify the permissions of these groups and assign users into them.

Do not create duplicate groups.

If the groups already exist, update them instead of creating new records.

---

# LPR Center Permission Structure

The page only manages permissions for the following menu hierarchy.

## 1. ข่าว/ประกาศระบบ

## 2. ตรวจหาทะเบียนรถ

* แบบระบุเงื่อนไข
* ก่อน/หลังผ่านด่านตรวจ

## 3. ตรวจหาใบหน้า

* ค้นหาด้วยใบหน้า
* ค้นหาด้วยหมายเลขทะเบียน

## 4. ระบบวิเคราะห์ยานพาหนะ

* ทะเบียนปลอม
* สวมทะเบียน
* วิเคราะห์ยานพาหนะจากทะเบียน (Convoy)
* วิเคราะห์ยานพาหนะจากด่านตรวจ

## 5. เฝ้าระวัง

* จัดการรถเฝ้าระวัง

## 6. วิเคราะห์ข้อมูล

* แผนที่สืบสวน
* วิเคราะห์ความสัมพันธ์

## 7. แผนที่

* แผนที่
* Heat map

## 8. จัดการระบบ

* จัดการด่าน/กล้อง
* จัดการข่าว/ประกาศระบบ

No other menus should appear on this page.

---

# Page Layout

Create a modern administrative interface consistent with the existing User Management module.

Recommended layout:

## Left Panel

* Group selector
* Group information
* Search permission
* Permission tree
* Permission summary
* Reset button
* Save button

## Right Panel

Selected Group Information

### Assigned Users

Display all users currently assigned to the selected group.

Columns such as:

* Username
* Full Name
* Department
* Position
* Status

Actions:

* Remove from Group

Above the table provide:

**Assign User**

Clicking this button opens a dialog.

---

# Assign User Dialog

The dialog should allow administrators to search and assign users into the selected LPR Center group.

Search by:

* Username
* Full Name
* Employee ID
* Organization
* Department

Use the existing User Management search APIs whenever possible.

The dialog should:

* Support pagination.
* Support searching.
* Support sorting if already available.
* Exclude users already assigned to the selected group.
* Allow single or multiple user selection.
* Show the number of selected users.
* Confirm before assigning.

After assignment:

* Refresh the Assigned User list.
* Show success notification.

---

# Remove User

Each assigned user row should include:

Remove

Before removing:

Show confirmation dialog.

Removing a user should only remove the user from the selected **LPR Center group**.

It must **NOT** delete the user account.

It must **NOT** remove the user's other application groups or permissions.

---

# Group Assignment Rules

A user can belong to the appropriate LPR Center group according to the application's business rules.

Before implementing, inspect the existing group relationship model.

If the current system supports only one primary group per application, preserve that behavior.

If multiple application groups are already supported, integrate with the existing design rather than replacing it.

Do not modify unrelated group memberships.

When assigning users:

* Preserve existing permissions from other systems.
* Only update the LPR Center group relationship.
* Never overwrite unrelated application permissions.

---

# Permission Tree

Display permissions as a hierarchical checkbox tree.

Support:

* Parent selects children.
* Parent unselect clears children.
* Indeterminate parent state.
* Expand/Collapse.
* Search.
* Selected permission count.

Reuse existing shared checkbox/tree components whenever possible.

---

# Integration with lpr-center-web

Inspect:

`D:\Projects\lpr-center\lpr-center-web`

Ensure the saved permission keys exactly match those consumed by the frontend.

Verify:

* Sidebar visibility.
* Route authorization.
* Hidden parent menu when all children are inaccessible.
* Direct URL protection.
* Refresh behavior.

Do not invent new permission keys if existing ones already exist.

---

# API Requirements

Inspect existing User Management APIs for:

* Get Groups
* Get Group Detail
* Get Group Permissions
* Update Group Permissions
* Search Users
* Get Group Members
* Add Group Members
* Remove Group Members

Reuse existing API services.

Do not create duplicate APIs if suitable endpoints already exist.

If a required endpoint does not exist, document the backend requirement clearly instead of mocking the functionality.

---

# Validation

Prevent:

* Duplicate group names.
* Duplicate user assignments.
* Invalid permission keys.
* Double submission.
* Unsaved changes being lost without confirmation.

---

# Technical Requirements

* TypeScript only.
* No `any`.
* Reuse shared components.
* Centralize permission definitions.
* Keep recursive permission logic reusable.
* Preserve all existing application behavior.
* Preserve unrelated permissions and unrelated group memberships.

---

# Verification

After implementation:

* Run `npx tsc --noEmit`
* Run `npm run build`
* Fix every TypeScript error.
* Fix every build error.

Then verify:

* Loading groups.
* Editing permissions.
* Saving permissions.
* Assigning users.
* Removing users.
* Searching users.
* Pagination.
* Duplicate assignment prevention.
* Permission inheritance.
* Indeterminate checkbox state.
* Route authorization inside `lpr-center-web`.
* Menu visibility inside `lpr-center-web`.
* Existing user-management functionality remains unaffected.

Finally provide a concise implementation summary including:

* Files created
* Files modified
* Routes added
* Menu added
* Permission keys used
* APIs used
* User assignment flow
* Permission inheritance behavior
* Build result
* TypeScript result
* Remaining backend requirements
