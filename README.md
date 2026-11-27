# Clean Sheet Studio

สร้างเว็บแอปพลิเคชันสำหรับแก้ปัญหาไฟล์ CSV และตาราง Excel เบี้ยว ใช้งานผ่านเบราว์เซอร์ได้ทันที โดยประมวลผลฝั่งผู้ใช้งาน (Client-Side / Local-First) 100% ห้ามส่งข้อมูลไฟล์ออกไปที่เซิร์ฟเวอร์ภายนอก และไม่ต้องติดตั้งโปรแกรมเพิ่มเติม

ฟีเจอร์หลักที่ต้องการ (เน้นใช้งานง่าย จบในไม่กี่คลิก):

อัปโหลดหรือลากวางไฟล์ (.csv, .xlsx, .xls) และแสดงตัวอย่างตารางก่อนแก้ (Preview)

รองรับการอ่านไฟล์ CSV ภาษาไทยให้ไม่เพี้ยน (ตรวจจับและจัดการ encoding / ตัวคั่นอัตโนมัติ)

มีปุ่ม/ตัวเลือกทำความสะอาดข้อมูลที่พบบ่อย:

ล้างช่องว่างหน้า-หลังข้อความ (Trim) และลดช่องว่างซ้ำ

ลบแถวว่างทั้งหมด และแถวซ้ำซ้อน

แปลงตัวเลขที่ติดสัญลักษณ์สกุลเงิน/จุลภาค/ช่องว่าง ให้เป็นตัวเลขแท้ที่นำไปบวกหรือคำนวณได้

จัดรูปแบบวันที่ให้อยู่ในมาตรฐานเดียวกัน

แสดงตารางตัวอย่างหลังแก้ (เปรียบเทียบให้เห็นความเปลี่ยนแปลง)

มีปุ่ม "ดาวน์โหลดไฟล์ที่แก้ไขแล้ว" (รองรับทั้ง .xlsx และ .csv ที่เปิดภาษาไทยใน Excel ได้ตรง)

หน้าตาเว็บเรียบง่าย สบายตา รองรับทั้งหน้าจอคอมพิวเตอร์และมือถือ มีข้อความเน้นย้ำชัดเจนว่า "ข้อมูลประมวลผลในเครื่องของคุณ 100% ข้อมูลไม่หลุดออกไปภายนอก"

เขียนโค้ดให้พร้อมรันและใช้งานได้จริงในรอบแรก ไม่ต้องเพิ่มฟีเจอร์ซับซ้อนเกินความจำเป็น

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c4d8193-df69-4b33-910f-7cdb34d34c60).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
