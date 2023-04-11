import React from "react";
import * as ReactDOM from "react-dom";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { EuiProvider } from "@elastic/eui";
import {
    EntitiesSearchPage,
    EntityPage,
    entityLoader,
    ErrorPage,
    HomePage,
    LetterPage,
    letterLoader,
    LettersSearchPage,
    TimeLinePage,
} from "./pages";
import { Root } from "./Root";
import "./assets/index.css";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <HomePage /> },
            {
                path: "entities",
                element: <EntitiesSearchPage />,
            },
            {
                path: "entities/:entityId",
                element: <EntityPage />,
                loader: entityLoader,
            },
            {
                path: "letters",
                element: <LettersSearchPage />,
            },
            {
                path: "letters/:letterId",
                element: <LetterPage />,
                loader: letterLoader,
            },
            {
                path: "timeline",
                element: <TimeLinePage />,
            },
        ],
    },
]);

ReactDOM.render(
    <React.StrictMode>
        <EuiProvider colorMode="light">
            <RouterProvider router={router} />
        </EuiProvider>
    </React.StrictMode>,
    document.getElementById("root"),
);
