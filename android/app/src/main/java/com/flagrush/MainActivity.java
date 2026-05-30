package com.flagrush;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureWebViewAudio();
    }

    @Override
    public void onPause() {
        dispatchAudioLifecycleEvent("flagrushpause");
        pauseWebViewAudio();
        super.onPause();
    }

    @Override
    public void onStop() {
        dispatchAudioLifecycleEvent("flagrushpause");
        pauseWebViewAudio();
        super.onStop();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewAudio();
        resumeWebViewAudio();
        dispatchAudioLifecycleEvent("flagrushresume");
    }

    private void configureWebViewAudio() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    private void pauseWebViewAudio() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onPause();
        }
    }

    private void resumeWebViewAudio() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
        }
    }

    private void dispatchAudioLifecycleEvent(String eventName) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('" + eventName + "'));",
                    null
                )
            );
        }
    }
}
