import UIKit
import WebKit
import Capacitor

class BridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.webView?.allowsBackForwardNavigationGestures = true
    }
}
