/**
 * Dieser Alexa-Skill dient zur Nutzung der Wahlhilfe für DECT-Telefone an Fritz!Boxen.
 */
const Alexa = require('ask-sdk-core');

/**
 * Sicherung von Telefonbuch und Optionen im S3.
 */
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

/**
 * Bibliothek für Aktionen auf der Fritzbox.
 */
const fritz = require('fritzbox.js')

/**
 * Definition der verfügbaren Basisstationen. Die Schlüssel dienen als Name der Basis. Die Verbindung geschieht
 * über einen Traefik-Reverse-Proxy, da AWS-Lambda keine IPv6-Unterstützung bietet und einige der definierten
 * Fritzboxen nur per IPv6 erreichbar sind. Das Backend ist dann jeweils die Myfritz-Adresse der Fritz!Box.
 */
const fritz_options = require('./fritzboxen.json');

/**
 * In diesen globalen Variablen werden Telefonbuch und Optionen gecacht.
 */
let phonebook = {};
let options = {};
let deviceId = undefined;

/**
 * Methode zum Wählen einer Nummer auf der Basis-Fritz!Box.
 */
async function dial(number, basis) {
    const status = await fritz.dialNumber(number, fritz_options[basis])
    if (status.error) {
        console.log('Error: ' + status.error.message);
        return false;
    } else {
        console.log(status.message)
        return true;
    }
}

/**
 * Sichern von Telefonbuch und Optionen in der Persistenz.
 */
async function save(handlerInput) {
    const attributes = {phonebook, options};
    console.log("attributes to save: ", JSON.stringify(attributes));
    handlerInput.attributesManager.setPersistentAttributes(attributes)
    await handlerInput.attributesManager.savePersistentAttributes();
    console.log("saved");
}

/**
 * Lesen von Telefonbuch und Optionen aus der Persistenz.
 */
async function read(handlerInput) {
    console.log("read...");
    const attributes = await handlerInput.attributesManager.getPersistentAttributes();
    console.log("attributes read: ", JSON.stringify(attributes));
    phonebook = attributes.phonebook;
    options = attributes.options;
}

/**
 * Handler für den Start des Skills. Es werden die Daten aus der Persistenz gelesen, wenn notwendig migriert
 * und in der aktuellen Version gespeichert. Nach dieser Initialisierung stehen Telefonbuch und Optionen
 * in den globalen Variablen in der aktuellen Version zur Verfügung.
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

        console.log('Skill launched.');

        deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        console.log("DeviceId", deviceId);

        const attributes = await handlerInput.attributesManager.getPersistentAttributes();

        // Migration 0..1
        if (attributes.phonebook === undefined) {
            console.log("migrating to version 1");
            phonebook = attributes;
            options = { "basis" : attributes.basis, "version": 1 };
            delete phonebook.basis
            console.log("migration done", attributes);
            handlerInput.attributesManager.setPersistentAttributes(attributes);
            await handlerInput.attributesManager.savePersistentAttributes();
            console.log("saved");
        }

        // Migrate 1..2 - Basis pro Device speichern
        if (attributes.options.version === 1) {
            console.log("migrating to version 2");
            const basis = attributes.options.basis;
            attributes.options.basis = {};
            attributes.options.basis[deviceId] = basis;
            attributes.options.version = 2;
            console.log("migration done", attributes);
            handlerInput.attributesManager.setPersistentAttributes(attributes);
            await handlerInput.attributesManager.savePersistentAttributes();
            console.log("saved");
        }

        await read(handlerInput);

        const speakOutput = '"Telefon bedienen" ist startklar. Was kann ich für dich tun?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Intent zum Wählen anhand eines Namens. Die Nummer wird aus dem Telefonbuch ermittelt.
 */
const MitNameAnrufenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MitNameAnrufen';
    },
    async handle(handlerInput) {
        console.log('Mit Name anrufen.');
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const nummer = phonebook[name]
        if (nummer === undefined) {
            const speakOutput = `Es ist kein Eintrag für ${name} im Telefonbuch. Was soll ich tun?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        } else {
            const basis = options.basis[deviceId]
            if (basis === undefined) {
                const speakOutput = `Es ist keine Basis festgelegt. Das geht zum Beispiel mit dem Befehl "Basis MIO festlegen"`;
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Was ist noch zu tun?')
                    .getResponse();
            }
            if (await dial(nummer, basis)) {
                const speakOutput = `Ich habe die Nummer von ${name} gefunden und gewählt. Es klingelt bei dir, wenn die Verbindung zustande kommt. Tschüss!`;
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .withShouldEndSession(true)
                    .getResponse();
            } else {
                const speakOutput = `Ich habe die Nummer von ${name} zwar gefunden, doch beim Wählen trat ein Fehler auf. Was soll ich tun?`;
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Was ist noch zu tun?')
                    .getResponse();
            }
        }
    }
};

/**
 * Intent zum Wählen einer Nummer ohne Nutzung des Telefonbuchs.
 */
const MitNummerAnrufenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MitNummerAnrufen';
    },
    async handle(handlerInput) {
        console.log('Mit Nummer anrufen.');
        const nummer = handlerInput.requestEnvelope.request.intent.slots.nummer.value;
        const basis = options.basis[deviceId]
        if (basis === undefined) {
            const speakOutput = `Es ist keine Basis festgelegt. Das geht zum Beispiel mit dem Befehl "Basis MIO festlegen"`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
        if (await dial(nummer, basis)) {
            const speakOutput = `Ich habe die Nummer gewählt. Es klingelt bei dir, wenn die Verbindung zustande kommt. Tschüss!`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .withShouldEndSession(true)
                .getResponse();
        } else {
            const speakOutput = 'Beim Wählen der Nummer trat leider ein Fehler auf. Was soll ich tun?';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
    }
};

/**
 * Intent zum Ansagen einer Nummer, die aus dem Telefonbuch ermittelt wird.
 */
const NummerAnsagenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NummerAnsagen';
    },
    async handle(handlerInput) {
        console.log('Nummer ansagen.');
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        const nummer = phonebook[name]
        if (nummer === undefined) {
            const speakOutput = `Es ist kein Eintrag für ${name} im Telefonbuch. Was soll ich tun?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        } else {
            const speakOutput = `Ich habe die Nummer gefunden. Sie lautet ${nummer}. Was ist noch zu tun?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
    }
};

/**
 * Intent zum Ansagen der aktuell eingestellten Basis.
 */
const BasisAnsagenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BasisAnsagen';
    },
    async handle(handlerInput) {
        console.log('Basis ansagen.');
        const basis = options.basis[deviceId]
        if (basis === undefined) {
            const speakOutput = `Es ist keine Basis festgelegt. Was soll ich tun?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        } else {
            const speakOutput = `Als Basis ist ${basis} festgelegt. Was ist noch zu tun?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
    }
};

/**
 * Intent zum Speichern eines Eintrags, bestehend aus Name und Nummer, im Telefonbuch.
 */
const EintragSpeichernHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EintragSpeichern';
    },
    async handle(handlerInput) {
        console.log('Eintrag speichern.');
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        if (name === undefined) {
            return handlerInput.responseBuilder
                .speak("Ich habe den Namen nicht verstanden. Kannst du den Befehl bitte wiederholen?")
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
        const nummer = handlerInput.requestEnvelope.request.intent.slots.nummer.value;
        if (nummer === undefined) {
            return handlerInput.responseBuilder
                .speak("Ich habe die Nummer nicht verstanden. Kannst du den Befehl bitte wiederholen?")
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
        phonebook[name] = nummer;
        await save(handlerInput);
        const speakOutput = `Die Nummer ${nummer} wurde unter dem Namen ${name} gespeichert. Was ist noch zu tun?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Was ist noch zu tun?')
            .getResponse();
    }
};

/**
 * Intent zum Festlegen der Basis anhand ihres Namens. Sie wird in den Optionen gespeichert.
 */
const BasisFestlegenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BasisFestlegen';
    },
    async handle(handlerInput) {
        console.log('Basis festlegen.');
        const basis = handlerInput.requestEnvelope.request.intent.slots.basis.value;
        if (basis === undefined) {
            return handlerInput.responseBuilder
                .speak("Ich habe den Namen der Basis nicht verstanden. Es ist ZUHAUSE, MIO oder UNTERE erlaubt. Kannst du den Befehl bitte wiederholen?")
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
        options.basis[deviceId] = basis;
        await save(handlerInput);
        const speakOutput = `Es wurde ${basis} als Basis festgelegt. Was ist noch zu tun?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Was ist noch zu tun?')
            .getResponse();
    }
};

/**
 * Intent zum Löschen eines Eintrags aus dem Telefonbuch.
 */
const EintragLoeschenHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EintragLoeschen';
    },
    async handle(handlerInput) {
        console.log('Eintrag löschen.');
        const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
        if (name === undefined) {
            return handlerInput.responseBuilder
                .speak("Ich habe den Namen nicht verstanden. Kannst du den Befehl bitte wiederholen?")
                .reprompt('Was ist noch zu tun?')
                .getResponse();
        }
        delete phonebook[name];
        await save(handlerInput);
        const speakOutput = `Der Eintrag unter dem Namen ${name} wurde entfernt. Was ist noch zu tun?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Was ist noch zu tun?')
            .getResponse();
    }
};

/**
 * Intent zur Hilfegebung für den Benutzer.
 */
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = `
            Du kannst so etwas sagen wie: "Andreas anrufen" oder "Wähle 1 2 3 4 5". Dann wähle ich direkt eine Nummer. Vergiss dabei aber die Vorwahl nicht.
            
            Du kannst Einträge in meinem Telefonbuch hinterlegen. Dieses Telefonbuch ist aber nur über dieses "Telefon bedienen" nutzbar.
            Befehle für das Telefonbuch sind "Speichere 47 11 unter Kölnisch Wasser" oder "Lösche Kölnisch Wasser".
            
            Du kannst auch die Nummer eines Telefonbucheintrags ansagen lassen. Dazu sag "Wie ist die Nummer von Andreas".
            
            Damit ich weiß, wie ich dein Telefon erreiche, muss einmalig eine Basis hinterlegt sein. 
            Das machst du mit "Basis mio". Das muss nur einmal gemacht werden, danach ist es wie die Einträge im Telefonbuch gespeichert.
            
            Als Basis ist eine der Angaben "mio", "zuhause" oder "untere" möglich. Die Basis wird pro Alexa-Gerät getrennt gespeichert,
            da das benutzte Alexa-Gerät vermutlich in der Nähe des benutzten Telefons steht.
                        
            Und wenn gar nichts mehr geht, Andreas fragen!
        `;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Intent zum Abbruch durch den Benutzer.
 */
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Tschüss!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ignored in locales that do not support it yet
 */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Entschuldigung, das habe ich nicht verstanden. Versuche es bitte noch einmal!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Was ist noch zu tun?')
            .getResponse();
    }
};

/**
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        console.log(JSON.stringify(handlerInput, null, 2));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder
            .speak('Tschüss!')
            .getResponse(); // notice we send an empty response
    }
};

/**
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents
 * by defining them above, then also adding them to the request handler chain below
 */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `Du hast ${intentName} ausgelöst`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below
 */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(JSON.stringify(handlerInput, null, 2));
        const speakOutput = 'Ich habs nicht verstanden oder es gab einen Fehler. Probiere es noch einmal!';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom
 */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        MitNameAnrufenHandler,
        MitNummerAnrufenHandler,
        EintragSpeichernHandler,
        EintragLoeschenHandler,
        NummerAnsagenHandler,
        BasisFestlegenHandler,
        BasisAnsagenHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName: process.env.S3_PERSISTENCE_BUCKET})
    )
    .lambda();
    