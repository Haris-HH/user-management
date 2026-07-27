# LPR Center Permission Page — Backend Requirements

The page at `/manage-lpr-center-group` is complete on the frontend. **Permission
editing works against existing endpoints today.** User assignment does not: it
needs the three endpoints in section 2, which do not exist yet.

---

## 1. What already works (no backend change needed)

Group listing and permission storage reuse existing endpoints:

| Purpose | Endpoint | Notes |
|---|---|---|
| List groups | `GET /user-management/user-groups/get` | Already used by `UserGroupManagement` |
| Save permissions | `PATCH /user-management/user-groups/update` | Writes the whole `UserGroup` incl. `permissions` |
| Search users (assign dialog) | `POST /user-management/users/search` | Filters: `username`, `fullname`, `idcard`, `ou_code`, `bh_code` |

The page writes only the `ui["lpr-center"]` branch of `permissions` and copies
every other branch through untouched, so `user-management`, `log-management`
and `checkpoint_ids` are preserved on save.

Stored shape:

```jsonc
{
  "ui": {
    "lpr-center": {
      "enabled": true,                    // false when zero permissions selected
      "groups": { "lpr_cond": "active" }  // only selected leaves are present
    }
  }
}
```

---

## 2. Required new endpoints — LPR Center membership

### Why a new relation is required

`User.user_group_id` is a **single, global** group id shared by
user-management and lpr-center-web. Writing LPR Center membership into it would
evict the user from their user-management group. The feature explicitly must not
alter unrelated group memberships, so membership needs its own relation
(conceptually `user_id × lpr_center_group_id`, many-to-many).

`group_id` references an existing `user-groups` record — no new group table.

### 2.1 Get members

```
GET /user-management/lpr-center-groups/members/get?group_id=<uuid>&page=1&limit=500
```
Returns `BasicResponse<User[]>` — the same `User` objects `/users/search`
returns (the page reads `username`, `firstname`, `lastname`, `ou_name`,
`position`, `account_status`), with the standard `pagination` block.

### 2.2 Add members

```
POST /user-management/lpr-center-groups/members/add
{ "group_id": "<uuid>", "user_ids": ["<uuid>", "..."] }
```
Must be idempotent — re-adding an existing member is a no-op, not an error.
Must not modify `user_group_id` or any other permission.

### 2.3 Remove members

```
POST /user-management/lpr-center-groups/members/remove
{ "group_id": "<uuid>", "user_ids": ["<uuid>"] }
```
Removes the membership row only. **Must not** delete the user account and
**must not** touch the user's `user_group_id`, other application groups, or
`permissions`.

Contract lives in `src/features/lpr-center/api/LprCenterApi.tsx`; request/response
types in `src/types/common.ts` (`LprCenterGroupMembersRequest`) and
`src/types/response.ts` (`LprCenterMembersResponse`).

---

## 3. Open question — do group permissions reach users?

`lpr-center-web` reads the **user's** `permissions` field
(`src/context/AuthProvider.tsx`, hydrated from `GET /user-management/users/get`),
**not** the group's, and contains no merge logic.

So unless the backend already propagates group permissions onto member users
(at login or on group update), editing a group here will have **no effect** in
lpr-center-web. Please confirm which of these is true:

- **A.** Backend resolves `user.permissions` from the user's group(s) → nothing
  more to do once membership exists.
- **B.** `user.permissions` is stored per-user → propagation must be added when
  group permissions change or membership changes.

This is the single most important thing to confirm; the page is otherwise
functionally complete.

---

## 4. Not done — `lpr-center-web` is still ungated

Every LPR Center menu in `lpr-center-web/src/layouts/nav.ts` currently sets **no**
`permissionKey`, and its `filterMenuByPermission` treats a keyless leaf as
visible to everyone ("public-until-mapped"). Nothing this page saves will change
what that app shows until those nav nodes are wired up.

The keys below were deliberately named after that app's existing nav node ids, so
wiring is a 1:1 edit with no data migration. Catalogue:
`src/constants/lprCenterPermissions.ts`.

| Menu | Permission key | Leaf |
|---|---|:--:|
| ข่าว/ประกาศระบบ | `lpr-center.news` | ✔ |
| ตรวจหาทะเบียนรถ | `lpr_find` (grouping only) | |
| — แบบระบุเงื่อนไข | `lpr-center.lpr_cond` | ✔ |
| — ก่อน/หลังผ่านด่านตรวจ | `lpr-center.lpr_ba` | ✔ |
| ตรวจหาใบหน้า | `face_find` (grouping only) | |
| — ค้นหาด้วยใบหน้า | `lpr-center.face_by_face` | ✔ |
| — ค้นหาด้วยหมายเลขทะเบียน | `lpr-center.face_by_plate` | ✔ |
| ระบบวิเคราะห์ยานพาหนะ | `veh_analysis` (grouping only) | |
| — ทะเบียนปลอม | `lpr-center.va_fake` | ✔ |
| — สวมทะเบียน | `lpr-center.va_clone` | ✔ |
| — วิเคราะห์ยานพาหนะจากทะเบียน (Convoy) | `lpr-center.va_convoy` | ✔ |
| — วิเคราะห์ยานพาหนะจากด่านตรวจ | `lpr-center.va_by_ck` | ✔ |
| เฝ้าระวัง | `lpr_watch` (grouping only) | |
| — จัดการรถเฝ้าระวัง | `lpr-center.wl_manage` | ✔ |
| วิเคราะห์ข้อมูล | `analysis` (grouping only) | |
| — แผนที่สืบสวน | `lpr-center.map` | ✔ |
| — วิเคราะห์ความสัมพันธ์ | `lpr-center.graph` | ✔ |
| แผนที่ | `maps` (grouping only) | |
| — แผนที่ | `lpr-center.wl_map` | ✔ |
| — Heat map | `lpr-center.heat_map` | ✔ |
| จัดการระบบ | `sysadmin` (grouping only) | |
| — จัดการด่าน/กล้อง | `lpr-center.a_ck` | ✔ |
| — จัดการข่าว/ประกาศระบบ | `lpr-center.news_mgmt` | ✔ |

17 leaves are persisted. Parent rows are **not** stored: `lpr-center-web` already
hides a parent when all its children are inaccessible, so storing a parent mode
would duplicate — and could contradict — what the consumer computes.

Two leaves have no node in `nav.ts` yet — `va_fake` (ทะเบียนปลอม) and `heat_map`
(Heat map). `wl_map` exists there but currently sits under เฝ้าระวัง; in this
catalogue it is grouped under the new แผนที่ section. Parents are not persisted,
so that regrouping is presentation-only and needs no data migration.

To activate gating there, add `permissionKey: 'lpr-center.<id>'` to the leaf
nodes in `nav.ts`, and set `permissionPolicy: 'required'` if menus should be
hidden rather than public when a key is absent.
