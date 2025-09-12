import React from 'react';
import { Modal, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon } from '@/components-next';
import i18n from '@/i18n';
import { WarningIcon } from '@/svg-icons';
import { tailwind } from '@/theme';

interface VersionBlockModalProps {
  visible: boolean;
  minVersion: string;
  currentVersion: string;
}

export const VersionBlockModal: React.FC<VersionBlockModalProps> = ({
  visible,
  minVersion,
  currentVersion,
}) => {
  const handleOk = () => {
    // Do nothing - user cannot dismiss this modal
    // They must update the app to continue
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <SafeAreaView style={tailwind.style('flex-1 bg-white')}>
        <View style={tailwind.style('flex-1 justify-center items-center px-6')}>
          <View style={tailwind.style('items-center mb-8')}>
            <View style={tailwind.style('mb-6')}>
              <Icon icon={<WarningIcon />} size={64} style={tailwind.style('text-amber-600')} />
            </View>

            <Animated.Text
              style={tailwind.style(
                'text-2xl text-gray-950 font-inter-semibold-20 text-center mb-4',
              )}>
              {i18n.t('VERSION_CHECK.TITLE')}
            </Animated.Text>

            <Animated.Text
              style={tailwind.style(
                'text-base text-gray-700 font-inter-normal-20 text-center leading-6 mb-6',
              )}>
              {i18n.t('VERSION_CHECK.MESSAGE', { version: minVersion })}
            </Animated.Text>

            <View style={tailwind.style('bg-gray-50 p-4 rounded-xl w-full')}>
              <View style={tailwind.style('flex-row justify-between items-center mb-2')}>
                <Animated.Text style={tailwind.style('text-sm text-gray-600 font-inter-420-20')}>
                  Versão atual:
                </Animated.Text>
                <Animated.Text style={tailwind.style('text-sm text-gray-900 font-inter-medium-24')}>
                  {currentVersion}
                </Animated.Text>
              </View>
              <View style={tailwind.style('flex-row justify-between items-center')}>
                <Animated.Text style={tailwind.style('text-sm text-gray-600 font-inter-420-20')}>
                  Versão mínima:
                </Animated.Text>
                <Animated.Text style={tailwind.style('text-sm text-blue-800 font-inter-medium-24')}>
                  {minVersion}
                </Animated.Text>
              </View>
            </View>
          </View>

          <View style={tailwind.style('w-full')}>
            <Button text={i18n.t('VERSION_CHECK.OK')} handlePress={handleOk} variant="primary" />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
