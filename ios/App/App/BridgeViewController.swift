import UIKit
import WebKit
import Capacitor

class BridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private let swipeBackHandlerName = "onsikkuSwipeBack"

    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.webView?.allowsBackForwardNavigationGestures = false
        bridge?.webView?.configuration.userContentController.add(self, name: swipeBackHandlerName)
    }

    deinit {
        bridge?.webView?.configuration.userContentController.removeScriptMessageHandler(forName: swipeBackHandlerName)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == swipeBackHandlerName else { return }

        if let enabled = message.body as? Bool {
            bridge?.webView?.allowsBackForwardNavigationGestures = enabled
            return
        }

        if let body = message.body as? [String: Any],
           let enabled = body["enabled"] as? Bool {
            bridge?.webView?.allowsBackForwardNavigationGestures = enabled
        }
    }
}
