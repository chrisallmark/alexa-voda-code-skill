import Alexa from "ask-sdk-core";
import ado from "./ado.mjs";

export const RepositoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "RepositoryIntent"
    );
  },
  async handle(handlerInput) {
    const repository = Alexa.getSlotValue(
      handlerInput.requestEnvelope,
      "repository"
    );
    const repositories = (await ado.repositories(repository)).value;
    const response = handlerInput.responseBuilder;
    if (repositories.length === 0) {
      response.speak(
        `I'm sorry, but I can't find a repository name ${repository}.`
      );
    } else if (repositories.length === 1) {
      const sessionAttributes =
        handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.repository = repositories.pop();
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      return response
        .speak(
          `Ok, I'm using the ${repository} repository. What whould you like to know?`
        )
        .reprompt(
          `What do you want to know about the ${repository} repository?`
        )
        .getResponse();
    } else if (repositories.length <= 3) {
      response.speak(
        `I found ${
          repositories.length
        } code repositories matching that name - ${repositories
          .map((repo) => repo.name)
          .join(", ")} - which one should I use?`
      );
    } else {
      response.speak(
        `I found several matching repositories. Can you give me the exact code repository to use.`
      );
    }
    return response
      .reprompt("Say 'use' followed by the repository name.")
      .getResponse();
  },
};
