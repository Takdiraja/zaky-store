package id.zakystore.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin lokal HARUS didaftarkan SEBELUM super.onCreate() (init bridge).
        registerPlugin(BluetoothPermissionPlugin.class);
        registerPlugin(BluetoothPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
