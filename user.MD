# CerviGuard - Ghid utilizator (scurt)

## Functionalitati principale
- Autentificare cu username/parola, sesiune persistenta si logout.
- Roluri: clinician (user) si admin, cu acces diferentiat.
- Incarcare imagini cervicale (PNG/JPG/WEBP, max. 20MB) cu note optionale.
- Istoric cazuri cu status (processing/completed/error) si acces la detalii.
- Vizualizare analiza AI: tip zona de transformare (TZ), evaluare leziuni, sumar, scor de risc.
- Metadate imagine (dimensiuni, calitate, canale) si identificator CID pentru trasabilitate.
- Profil: schimbare parola.
- Admin: creare utilizatori, schimbare rol, activare/inactivare, resetare parola, vizualizare toate cazurile.

## Flux tipic
1. Autentificare.
2. Upload imagine + note.
3. Asteptare analiza automata si consultare rezultate in pagina cazului.

## Note de utilizare
- Imaginile trebuie de-identificate inainte de upload.
- Accesul la cazuri este restrictionat la propriile cazuri (exceptand admin).
