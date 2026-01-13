# CerviGuard - Ghid Utilizator

## Descriere Generală

CerviGuard este o aplicație web pentru screening-ul cancerului de col uterin. Platforma permite clinicienilor să încarce imagini cervicale și să primească analize automate bazate pe inteligență artificială.

## Funcționalități Principale

### Autentificare și Sesiuni
- Autentificare securizată cu nume de utilizator și parolă
- Sesiuni cu durată de 8 ore
- Schimbare parolă din profilul utilizatorului

### Încărcare și Analiză Cazuri
- Încărcare imagini cervicale (format standard: JPG, PNG)
- Adăugare note clinice opționale
- Analiză automată AI cu rezultate în timp real
- Urmărirea statusului cazurilor (în procesare → finalizat/eroare)

### Rezultatele Analizei AI

Fiecare caz analizat oferă:

| Indicator | Descriere |
|-----------|-----------|
| **Tip Zonă de Transformare** | Clasificare: Tip 1, Tip 2 sau Tip 3 |
| **Evaluare Leziuni** | Nivel: absent, scăzut, moderat sau ridicat |
| **Scor de Risc** | Valoare numerică 0-100 |
| **Calitate Imagine** | Evaluarea calității imaginii încărcate |
| **Informații Imagine** | Dimensiuni, canale de culoare, mărime fișier |

### Dashboard
- Vizualizare statistici generale
- Acces rapid la cazurile recente
- Indicatori de status pentru cazuri

### Gestionarea Cazurilor
- Lista completă a cazurilor proprii
- Filtrare și căutare
- Vizualizare detalii caz cu imaginea originală
- Istoricul rezultatelor

## Funcționalități Administrator

Utilizatorii cu rol de administrator au acces la:

### Gestionare Utilizatori
- Creare conturi noi (utilizator sau administrator)
- Activare/dezactivare conturi
- Resetare parole
- Modificare roluri

### Vizualizare Globală
- Acces la toate cazurile din sistem
- Statistici pe întreaga platformă

## Securitate și Confidențialitate

- Imagini stocate criptat folosind tehnologie R1FS
- Autentificare cu token-uri JWT securizate
- Cookie-uri httpOnly pentru prevenirea atacurilor XSS
- Control acces bazat pe roluri (RBAC)

## Fluxul de Lucru Tipic

1. **Autentificare** în platformă
2. **Navigare** la secțiunea "Cazuri"
3. **Încărcare** imagine cervicală cu note opționale
4. **Așteptare** procesare (statusul devine "finalizat")
5. **Vizualizare** rezultate și recomandări AI
6. **Deconectare** la finalizarea sesiunii

## Note Importante

- Imaginile trebuie să fie clare și bine iluminate pentru rezultate optime
- Sistemul indică automat dacă calitatea imaginii este suficientă
- Rezultatele AI sunt sugestive și trebuie validate de personal medical calificat
- Sesiunile expiră automat după 8 ore de inactivitate
