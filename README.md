# Alexa-Skill: "Telefon bedienen"

## Projektstatus

* DEVELOPMENT!!
* Keine Wartung
* Wenig Zeit für Pflege

Der Aufruf des Skills erfolgt mit **"Telefon bedienen"**. 
Der Skill dient dazu, die Wählhilfe einer Fritz!Box zu steuern.

## Aktionen

Mit den folgenden Aufforderungen können verschiedene Aktionen ausgelöst werden. Bevor gewählt werden kann, 
muss die Basis festgelegt werden.

### Mit Name anrufen
* {name} wählen
* Mit {name} telefonieren
* {name}
* Ich möchte mit {name} telefonieren
* Wähle {name}
* Wähl {name}
* Ruf {name} an
* {name} anrufen

### Mit Nummer anrufen
* Rufe {nummer} an
* Ruf {nummer} an
* {nummer}
* {nummer} wählen
* Wähle {nummer}
* {nummer} anrufen

### Eintrag speichern
* Speichere {nummer} für {name}
* Speichere {nummer} als {name}
* Speichere {nummer} unter {name}
* Speichere {name} mit Nummer {nummer}
* Nummer {nummer} für {name} speichern
* Nummer {nummer} als {name} speichern
* Nummer {nummer} unter {name} speichern
* Nummer {nummer} für {name} sichern
* Nummer {nummer} als {name} sichern
* Nummer {nummer} unter {name} sichern
* Nummer {nummer} für {name} ablegen
* Nummer {nummer} als {name} ablegen
* Nummer {nummer} unter {name} ablegen
* Nummer {nummer} speichern für {name}
* Nummer {nummer} speichern als {name}
* Nummer {nummer} speichern unter {name}

### Eintrag loeschen
* Lösche {name}
* {name} löschen
* Eintrag {name} löschen
* Eintrag für {name} löschen

### Nummer ansagen
* Such die Nummer von {name}
* Gibt es {name} im Telefonbuch
* Welche Nummer hat {name}
* Gibt es {name}
* Wie lautet die Nummer von {name}
* Ist {name} gespeichert
* Ist {name} im Telefonbuch
* Nummer von {name}
* Sag mir die Nummer von {name}
* Wie ist die Nummer von {name}

### Basis festlegen
* Basis {basis}
* {basis} als Basis festlegen
* Neue Basis ist {basis}
* Neue Basis {basis}
* Die Basis ist {basis}
* Basis ist {basis}
* Basis {basis} festlegen

### Basis ansagen
* Was ist als Basis festgelegt
* Was ist als Basis gesetzt
* Was ist die Basis
* Ist eine Basis gesetzt
* Ist eine Basis festgelegt
* Sag mir die Basis
* Welche Basis
* Wie ist die Basis
* Welches ist die Basis
* Welche Basis ist festgelegt

## Typen

### Mögliche Werte für Basis:
* ingrid
* zuhause
* untere

## Standard-Aktionen

### Stop
* Halt
* Stop

### Abbrechen
* Nix
* Tschüss
* Beenden
* Nichts
* Fertig
* Abbrechen
* Ende
* Abbruch

### Hilfe
* Was kann ich sagen
* Was kann ich tun
* Wie geht das
* Hilf mir
* Hilfe

### Zurück zum Start
* Nicht so
* Nein
* Nochmal
* Von vorn


## Installation ##

* Alexa-Skill erzeugen und über die de-DE.json-Datei die Intents konfigurieren
* Deploy des lambda-Verzeichnisses auf AWS-Lambda als Alexas-Hosted-Skill
* In der Fritz!box die Wählhilfe einschalten und die Erreichbarkeit von außen erlauben
* Einen passenden Benutzer auf der Fritz!box einrichten, ggf. Rechte einschränken 
* Die Datei fritzboxen-example.json in fritzboxen.json umbenennen und die eigenen Fritz!box-Zugangsdaten (von außen erreichbar) eintragen.


* Lambda kann aber kein IPv6. Wenn die eigenen Fritzbox nur per IPv6 erreichbar ist, kann man irgendwo auf einemn kleinen Server ein Traefik mit passender Weiterleitung 
einrichten. Die Beispielkonfiguration liegt als proxy-example.yml bei.
* 
