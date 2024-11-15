# Alexa-Skill: "Telefon bedienen"

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
* Nummer {nummer} speichern für {name}

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
* mio
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

Deploy auf AWS-Lambda. Das kann aber kein IPv6. Alternativ kann man irgendwo ein Traefik mit passender Weiterleitung 
einrichten. Die Beispieldatei liegt als proxy.yml bei.