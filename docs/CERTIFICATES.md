# Certificates

`certificates.js` (identical in both apps). Earned by passing a chapter/stage gate (achievement) and by passing every
gate of an HSK level (Hanzi Path) or a track (Cipher Path) (completion). Drawn on a 1600×1131 canvas: bilingual
(English/Arabic) with the Chinese title, the learner's name (`S.certName`, defaults to the account name), date,
verification code (`HP-…`/`CP-…`, from the anonymous client id + certificate id) and the app seal.

- New certificates are announced once (`S.certSeen`) the next time Home renders; all live under Me → My certificates
  (route `certs`).
- Share: in the app the PNG (data URL) goes to the native share sheet (`share` bridge message with `image`; iOS
  `Share.share({url})` accepts base64 images) → LinkedIn, X, WhatsApp, Photos. In a browser, Web Share with a file,
  or long-press the picture.
- Event `cert_share {cert}` for the funnel.
- Test: `python3 scripts/test_certificates.py hp|cp <phone-shell html> OUT` → `errors []`.
