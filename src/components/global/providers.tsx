"use client";

import React from "react"
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
    children: React.ReactNode;
}

// const client = new QueryClient();

const Providers = ({ children }: Props) => {
    return (
        // <QueryClientProvider client={client}>
        <Provider store={store}>
            {persistor ? (
                <PersistGate loading={null} persistor={persistor}>
                    {children}
                </PersistGate>
            ) : (
                children
            )}
        </Provider>
        // </QueryClientProvider>
    );
};

export default Providers