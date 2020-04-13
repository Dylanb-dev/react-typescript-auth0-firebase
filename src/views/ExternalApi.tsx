import React, { useState } from "react";
import { Button } from "reactstrap";
import { useAuth0 } from "../utils/auth0-spa";
import config from "../auth_config.json";
import firebase from 'firebase';
const database = firebase.database();

const { apiOrigin = "http://localhost:3001" } = config;

const ExternalApi = () => {
  const [showResult, setShowResult] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const { getTokenSilently } = useAuth0();

  const callApi = async () => {
    try {
        //@ts-ignore
        var userId = firebase.auth().currentUser.uid;
        // await database.ref('users/' + userId).set({
        //     username: 'testName',
        // });
        const snapshot = await database.ref('/users/' + userId).once('value')
        setShowResult(true);
      setApiMessage(JSON.stringify(snapshot.val()));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="mb-5">
        <h1>External API</h1>
        <p>
          Ping an external API by clicking the button below. This will call the
          external API using an access token, and the API will validate it using
          the API's audience value.
        </p>
        <h1>Firebase User</h1>
        <p>
            {JSON.stringify(firebase.auth().currentUser)}
        </p>
        <Button color="primary" className="mt-5" onClick={callApi}>
          Ping API
        </Button>
      </div>

      <div className="result-block-container">
        <div className={`result-block ${showResult && "show"}`}>
          <h6 className="muted">Result</h6>
            <p>{apiMessage}</p>
        </div>
      </div>
    </>
  );
};

export default ExternalApi;