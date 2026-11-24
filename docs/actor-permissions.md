# Actor permission matrix – FINAL review

| Capability                       | ADMIN | MANAGER    | CASHIER  | WAREHOUSE       |
| -------------------------------- | ----- | ---------- | -------- | --------------- |
| Login, logout, profile, password | Yes   | Yes        | Yes      | Yes             |
| User and role management         | Yes   | No         | No       | No              |
| Category/product API read        | No    | Yes        | Yes      | Yes             |
| Category/product write           | No    | Yes        | No       | No              |
| Suppliers                        | No    | Read/write | No       | Active read API |
| Receipt draft create/edit/cancel | No    | Yes        | No       | Yes             |
| Receipt confirmation             | No    | Yes        | No       | No              |
| Stock read                       | No    | Yes        | Yes      | Yes             |
| Movement read, adjustment draft  | No    | Yes        | No       | Yes             |
| Adjustment confirm               | No    | Yes        | No       | No              |
| Checkout                         | No    | No         | Yes      | No              |
| Invoice read                     | No    | All        | Own only | No              |
| Reports/dashboard                | No    | Yes        | No       | No              |

Source: gateway and service guards, ownership rules, web navigation. Category and supplier standalone web screens are Manager-only; read access for other roles is used by relevant workflows. UI guards do not replace backend checks. Runtime results: acceptance cases A02/A03/A06/A07/A11/A13 and U02/U05; consult acceptance.json for actual outcome, not source presence.
