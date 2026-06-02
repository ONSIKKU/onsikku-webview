import UIKit
import Capacitor

class BridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.webView?.allowsBackForwardNavigationGestures = false
    }
}
