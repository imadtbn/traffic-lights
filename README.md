# مدرسة السياقة

واجهة تعليمية عربية ثابتة تساعد المتعلم على فهم إشارات المرور وقواعد القيادة الآمنة من خلال صور فوتوغرافية واقعية وتفاعل خفيف يعمل دون إطار عمل أو خادم خلفي.

## البنية

| الملف أو المجلد | الدور |
| --- | --- |
| `index.html` | الهيكل الدلالي للصفحة، التنقل، الأقسام، الاختبار، النافذة الحوارية ومصادر الصور. |
| `styles.css` | نظام الألوان، التخطيط المتجاوب، البطاقات، الصور، حالات التركيز والحركة المخفّضة. |
| `app.js` | البحث، المرشحات، عرض البطاقات، التفاصيل، القائمة المتجاوبة والاختبار. |
| `data/signs.js` | بيانات الإشارات والتصنيفات والأوصاف والتصرف الصحيح وروابط الإسناد. |
| `assets/images/` | صور فوتوغرافية حقيقية محلية من Wikimedia Commons. |

## التشغيل المحلي

```bash
python3 -m http.server 8000
```

ثم افتح `http://localhost:8000` في المتصفح.

## الصور والإسناد

تتضمن النسخة صوراً فوتوغرافية حقيقية لإشارة التوقف، وإعطاء الأولوية، وحد السرعة، وعبور المشاة. روابط الملفات الأصلية وبيانات المؤلف والترخيص موجودة داخل قسم «صور واقعية، بإسناد واضح» وفي `data/signs.js`.

- [STOP sign.jpg — Bidgee — CC BY 3.0](https://commons.wikimedia.org/wiki/File:STOP_sign.jpg)
- [YieldSign.jpg — Smhenry87 — CC0](https://commons.wikimedia.org/wiki/File:YieldSign.jpg)
- [Road signs.jpg — Gausanchennai — CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Road_signs.jpg)
- [Malaysia Traffic-signs Warning-sign-28.jpg — CEphoto, Uwe Aranas — CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Malaysia_Traffic-signs_Warning-sign-28.jpg)

## ملاحظات الفحص

تمت إزالة الاعتماد على الحزمة المجمّعة القديمة وسكربتات التحرير والتحليلات الخاصة بمنصة النشر من النسخة المصدرية في المستودع. أصبح الكود قابلاً للقراءة والتعديل، مع دعم RTL، التنقل عبر لوحة المفاتيح، `prefers-reduced-motion`، وصف بديل للصور، وحالات فارغة للبحث.
