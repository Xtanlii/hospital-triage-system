<!-- ### CHANGES


## 1. COLOUR CHANGE FROM BLUE TO GREEN

## 2. DARK MODE YES/NO ?

## 3. THERE ARE 5 LEVELS OF PATIENT TRIAGE NOT 3
  ​Level 1 (Immediate / Resuscitation): Red
  ​Level 2 (Emergent): Orange
  ​Level 3 (Urgent): Yellow
  ​Level 4 (Less Urgent): Green 
  ​Level 5 (Non-urgent): Blue

## 4. CHANGE SERVER TO 5173

## 5. SWITCH FROM TAILWIND 3 TO TAILWIND 4 (DON'T NEED POST-CONFIG.CSS)

## 6. TEST WITH A DIFFERENT FONT STYLE ?

## 7. CHANGE FROM LUCIDE REACT ICONS ?

8.  Style the select dropdown or patient intake
9. Quick filter by name not working ?
10. What if  the person doesn't know his/her genotype
11. Decluster this board
12. Doctor checkin and checkout and reduction in no of active doctors etc
13. A doctor should only be able to see his own department queue

## 14. NETWORK FAILURE MECHANISM AND IMPLEMENTATIONS
 i. Client-side  caching
 ii. Server-side caching with redis client
 iii. ML model is offline ?
 iv. Can the system run when there is no network
 v. Can we run the Ml model offline ?

15. Mark as read for the notification icons
16. Be able to know when the system is online or offline
17. To be able to switch within light and dark mode
18. Profile pictures for users(nurses, doctors, admin)
19. There is an updated version of vite at least version 7
20. I feel like you should initialise with create vite app

New
Conditional verification for triage inputs if not available: we will deal with when there is a model
temporary loader in the frontend when getting data
Remember it is a dynamic queue that updates with new queue data, but we will do it such a way that non-urgent patients and the rest won't have to wait for too long -->

### CORRECTIONS / OBSERVATIONSgid
- Arrival datetime input should not be in the frontend when registering new triage. Should be in backend automatically by Date.now
- For the manually inputing symptoms duration I don't like it cos of maybe invalid input, you can substitute with ranges or values
-Override reason should not be compulsory
- View button not working for completed triage assessment logs
- Wtf is helicopter ? remove it and unknown
- I don't think we're meant to show patient hospital ID in frontend