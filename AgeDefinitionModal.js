import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  Button 
} from 'react-native';

const AgeDefinitionModal = ({ 
  visible, 
  onClose, 
  styles 
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.popupCard, { width: '90%' }]}>
          <Text style={[styles.popupTitle, { fontSize: 16, color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' }]}>
            📊 ĐỊNH NGHĨA GIAI ĐOẠN TUẦN TUỔI
          </Text>
          
          <View style={{ marginVertical: 10, borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#ffffff' }}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🍼 Giai đoạn Theo Mẹ:</Text>
                <Text style={[styles.detailVal, { color: '#0056b3' }]}>Sơ sinh đang bú mẹ</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🥛 Giai đoạn Cai Sữa:</Text>
                <Text style={[styles.detailVal, { color: '#0056b3' }]}>Vừa tách mẹ, tập ăn cám</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🐖 Giai đoạn Heo Choai:</Text>
                <Text style={[styles.detailVal, { color: '#e65100' }]}>Tính từ Tuần 5 đến Tuần 14</Text>
              </View>
              
              <View style={[styles.detailRow, { borderBottomWidth: 0, backgroundColor: '#fff3e0' }]}>
                <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#d32f2f' }]}>🔥 Giai đoạn Gần Xuất:</Text>
                <Text style={[styles.detailVal, { color: '#d32f2f', fontWeight: 'bold' }]}>Từ Tuần 15 trở lên</Text>
              </View>
            </View>
          </View>
          
          <View style={{ marginTop: 15 }}>
            <Button title="ĐÓNG BẢNG TRA CỨU" onPress={onClose} color="#6c757d" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AgeDefinitionModal;
