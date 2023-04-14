import Alexa from "ask-sdk-core";
import ado from "./ado.mjs";
import timeago from "timeago.js";

export const CommitIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "CommitIntent"
    );
  },
  async handle(handlerInput) {
    const count = parseInt(
      Alexa.getSlotValue(handlerInput.requestEnvelope, "count") || "1"
    );
    const sessionAttributes =
      handlerInput.attributesManager.getSessionAttributes();
    const repository = sessionAttributes.repository;
    const response = handlerInput.responseBuilder;
    if (repository) {
      const commits = await ado.commits(repository.id, count);
      if (commits.count === 1) {
        const commit = commits.value.pop();
        response.speak(
          `${commit.comment} was commited by ${
            commit.author.name
          } ${timeago.format(commit.author.date)} with ${
            commit.changeCounts.Add
          } additions, ${commit.changeCounts.Edit} edits and ${
            commit.changeCounts.Delete
          } deletions.`
        );
      } else {
        response.speak(
          `The last ${commits.count} commits were made by ${commits.value
            .map(
              (commit) =>
                commit.author.name + " " + timeago.format(commit.author.date)
            )
            .join(", ")
            .replace(/,(?=[^,]+$)/, ", and")}.`
        );
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
