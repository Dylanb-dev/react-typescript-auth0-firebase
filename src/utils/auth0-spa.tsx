import React, { useState, useEffect, useContext } from "react";
import firebase from "firebase";
import createAuth0Client from "@auth0/auth0-spa-js";
import config from "../auth_config.json";
import firebaseConfig from "../firebase_config.json";

firebase.initializeApp(firebaseConfig);

const { apiOrigin = "http://localhost:3001" } = config;

const DEFAULT_REDIRECT_CALLBACK = () =>
  window.history.replaceState({}, document.title, window.location.pathname);

export const Auth0Context = React.createContext<any>({});
export const useAuth0 = () => useContext(Auth0Context);
export const Auth0Provider = ({
  children,
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
  ...initOptions
}: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState();
  const [firebaseUser, setFirebaseUser] = useState();
  const [auth0Client, setAuth0] = useState();
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const initAuth0 = async () => {
      const auth0FromHook = await createAuth0Client(initOptions);

      setAuth0(auth0FromHook);

      if (
        window.location.search.includes("code=") &&
        window.location.search.includes("state=")
      ) {
        const { appState } = await auth0FromHook.handleRedirectCallback();

        onRedirectCallback(appState);
      }

      const isAuthenticated = await auth0FromHook.isAuthenticated();

      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const user = await auth0FromHook.getUser();
        const token = await auth0FromHook.getTokenSilently();
        const response = await fetch(`${apiOrigin}/auth`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log({ user });
        // history.push('/verify-email')
        const { firebaseToken } = await response.json();
        const fbUser = await firebase
          .auth()
          .signInWithCustomToken(firebaseToken);
        setFirebaseUser(fbUser);
        setUser(user);
        if (!user.email_verified) {
          setLoading(false);
          window.history.replaceState({}, document.title, "verify-email");
        }

        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    initAuth0();
    // eslint-disable-next-line
  }, []);

  const loginWithPopup = async (params = {}) => {
    setPopupOpen(true);
    try {
      await auth0Client.loginWithPopup(params);
    } catch (error) {
      console.error(error);
    } finally {
      setPopupOpen(false);
    }
    const user = await auth0Client.getUser();
    setUser(user);
    setIsAuthenticated(true);
  };

  const handleRedirectCallback = async () => {
    setLoading(true);
    await auth0Client.handleRedirectCallback();
    const user = await auth0Client.getUser();
    setLoading(false);
    setIsAuthenticated(true);
    setUser(user);
  };
  return (
    <Auth0Context.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        popupOpen,
        loginWithPopup,
        handleRedirectCallback,
        getIdTokenClaims: (...p: any) => auth0Client.getIdTokenClaims(...p),
        loginWithRedirect: (...p: any) => auth0Client.loginWithRedirect(...p),
        getTokenSilently: (...p: any) => auth0Client.getTokenSilently(...p),
        getTokenWithPopup: (...p: any) => auth0Client.getTokenWithPopup(...p),
        logout: (...p: any) => {
          firebase.auth().signOut();
          auth0Client.logout(...p);
        }
      }}
    >
      {children}
    </Auth0Context.Provider>
  );
};
