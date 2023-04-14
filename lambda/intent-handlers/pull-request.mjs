import Alexa from "ask-sdk-core";
import ado from "./ado.mjs";
import timeago from "timeago.js";

Alexa.getCanonicalSlotName = (requestEnvelope, slotName) => {
  const slot = Alexa.getSlot(requestEnvelope, slotName);
  if (slot.resolutions && slot.resolutions.resolutionsPerAuthority.length) {
    for (let resolution of slot.resolutions.resolutionsPerAuthority) {
      if (resolution.status && resolution.status.code === "ER_SUCCESS_MATCH") {
        return resolution.values[0].value.name;
      }
    }
  }
};

const pullRequestInfo = (pullRequest) =>
  `${pullRequest.title} was raised by ${
    pullRequest.createdBy.displayName
  } ${timeago.format(pullRequest.creationDate)}.`;

export const PullRequestIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "PullRequestIntent"
    );
  },
  async handle(handlerInput) {
    const query = Alexa.getCanonicalSlotName(
      handlerInput.requestEnvelope,
      "query"
    );
    const status =
      Alexa.getCanonicalSlotName(handlerInput.requestEnvelope, "status") ||
      "active";
    const time = Alexa.getCanonicalSlotName(
      handlerInput.requestEnvelope,
      "time"
    );
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    const repository = sessionAttributes.repository;
    const response = handlerInput.responseBuilder;
    if (repository) {
      const pullRequests = await ado.pullRequests(repository.id, status);
      switch (query) {
        case "count": {
          response.speak(
            `The ${repository.name} repository currently has ${pullRequests.count} ${status} pull requests.`
          );
          break;
        }
        case "list": {
          switch (time) {
            case "newest": {
              response.speak(pullRequestInfo(pullRequests.value.unshift()));
              break;
            }
            case "oldest": {
              response.speak(pullRequestInfo(pullRequests.value.pop()));
              break;
            }
            default: {
              response.speak(
                pullRequests.value
                  .map((pullRequest) => pullRequestInfo(pullRequest))
                  .join(" ")
              );
            }
          }
          break;
        }
      }
      response.reprompt(`What else would you like to know?`);
    } else {
      response
        .speak("Which code repository should I use?")
        .reprompt("Say 'use' followed by the repository name.");
    }
    return response.getResponse();
  },
};
