# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "Naly" [ref=e6] [cursor=pointer]:
          - /url: /news
          - img [ref=e7] [cursor=pointer]
          - generic [ref=e9] [cursor=pointer]: Naly
        - generic [ref=e10]:
          - link "News" [ref=e13] [cursor=pointer]:
            - /url: /news
            - img [ref=e14] [cursor=pointer]
            - generic [ref=e17] [cursor=pointer]: News
          - button "Sign in with Google" [ref=e19]
          - button "Settings" [ref=e21]:
            - img
            - generic [ref=e22]: Settings
    - main [ref=e23]:
      - generic [ref=e25]:
        - heading "404" [level=1] [ref=e26]
        - heading "This page could not be found." [level=2] [ref=e28]
  - region "Notifications alt+T"
  - alert [ref=e29]
```